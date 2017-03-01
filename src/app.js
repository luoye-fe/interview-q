/*
 * 基本：先用节流函数将在设定时间间隔内的请求收集起来一起执行，多余100个的请求先处理100个，剩下的递归调用，每次处理100个，获取数据完毕之后用广播机制告知每个调用者相对应的数据，
 * 进一步：本地缓存一份已知的 profile list，设定缓存时间，缓存时间内不发起真实请求，从本地取
 * 再进一步：ES6 来实现
 * 再再进一步：模块化，eventBus 和 cache 可以封装起来，最后 export 一个函数，调用的时候 import 即可
 */

import debounce from './debounce.js';
import Cache from './cache.js';
import EventBus from './event-bus.js';

// 现在有一个 Ajax 接口，根据用户 uid 获取用户 profile 信息，是一个批量接口。我把这个 ajax 请求封装成以下的异步函数
var requestUserProfile = function(uidList) { // uidList 是一个数组，最大接受 100 个 uid
	console.log('走接口啦', uidList.toString());
	// 这个方法的实现不能修改

	/** 先去重 */
	var uidList = uidList || [];
	var _tmp = {};
	var _uidList = [];
	uidList.forEach(function(uid) {
		if (!_tmp[uid]) {
			_tmp[uid] = 1;
			_uidList.push(uid);
		}
	});
	_tmp = null;
	uidList = null;

	return Promise.resolve().then(function() {
		return new Promise(function(resolve, reject) {
			setTimeout(function() { // 模拟 ajax 异步，1s 返回
				resolve();
			}, 1000);
		}).then(function() {
			var profileList = _uidList.map(function(uid) {
				if (uid < 0) { // 模拟 uid 传错，服务端异常，获取不到部分 uid 对应的 profile 等异常场景
					return null;
				} else {
					return {
						uid: uid,
						nick: uid + 'Nick',
						age: 18
					};
				}
			});
			return profileList.filter(function(profile) {
				return profile !== null;
			});
		});
	});
};

// 现在我们有很多业务都需要根据 uid 获取 userProfile , 大多数业务的需求都是给一个 uid，获取 profile 。为了性能，我们需要把这个单个的请求合并成批量请求。

// 例如，现在页面上 A 模块需要获取 uid 为 1 的 profile，B 模块需要 uid 为 2 的 profile， C 模块需要获取 uid 为 1 的profile
// 这三个模块会单独调用下面这个方法获取 profile，假设这三次调用的时间非常接近(100ms 以内)，最终要求只发送一个 ajax 请求（只调用一次 requestUserProfile )，拿到这三个模块需要的 profile

// 完成以下方法，接收一个参数 uid，返回一个 Promise，当成功请求到 profile 的时候， resolve 对应的profile , 请求失败 reject
// 例如  getUserProfile(1).then(function(profile){ console.log(profile.uid === 1) // true });  // 假设请求成功了。

class TaskQ {
	constructor() {
		this.queue = []; // id 列表
		this.debounceRun = debounce(this.runRealReQuest, 100);
		this.extraQueue = []; // 100个以外的 id 列表
	}
	add(id) {
		// 防止重复
		if (this.queue.indexOf(id) === -1) {
			if (this.queue.length >= 100) { // 多余 100 个的请求先放到一个数组中
				this.extraQueue.push(id);
			} else {
				this.queue.push(id);
			}
		};
		this.run();
	}
	run() {
		// 执行 debounceRun
		this.debounceRun()
			.then(profiles => {
				// 完成数据请求
				this.loop(profiles);
			});
	}
	loop(profiles) {
		// 触发 'done' 事件，通知调用者执行回调
		ProfileEventBus.emit('done', profiles);
		this.queue = [];
		// 大于100个的请求递归调用，直到 extraQueue 里没有内容
		if (this.extraQueue.length) {
			this.queue = this.extraQueue.splice(0, 100);
			this.run();
		}
	}
	runRealReQuest() {
		// 获取数据，走缓存或者走接口
		return new Promise((resolve, reject) => {
			let result = [];
			let curQueue = [...this.queue];
			for (let i in this.queue) {
				// 从缓存中取
				let cur = ProfileCache.get(this.queue[i]);
				if (cur) {
					result.push(cur);
					// 有缓存的 uid 从备请求列表中删除
					curQueue.shift();
				}
			}
			this.queue = curQueue;
			if (this.queue.length) {
				// 请求真实接口
				requestUserProfile(this.queue)
					.then(profiles => {
						for (let i in profiles) {
							// 设置缓存
							ProfileCache.set(profiles[i].uid, profiles[i]);
						}
						resolve(result.concat(profiles));
					});
			} else {
				resolve(result);
			}
		});
	}
}

const ProfileEventBus = new EventBus();
const ProfileRequetTaskQ = new TaskQ();
const ProfileCache = new Cache();

// 最后使用者调用的函数
export default function getUserProfile(id) {
	return new Promise((resolve, reject) => {
		// 向队列中添加 id
		ProfileRequetTaskQ.add(id);
		// 监听本次队列的 done 事件
		ProfileEventBus.on('done', profiles => {
			for (let i in profiles) {
				// uid 与 id 一致的 返回给调用者 (warning: uid 为 0 的时候！！！)
				if (profiles[i].uid !== undefined && profiles[i].uid === id) return resolve(profiles[i]);
			}
		});
	});
}
