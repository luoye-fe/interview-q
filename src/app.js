/*
 * 基本：先用节流函数将在设定时间间隔内的请求收集起来一起执行，多余100个的请求先处理100个，剩下的递归调用，每次处理100个，获取数据完毕之后用广播机制告知每个调用者相对应的数据，
 * 进一步：本地缓存一份已知的 profile list，设定缓存时间，缓存时间内不发起真实请求，从本地取
 * 再进一步：ES6 来实现
 * 再再进一步：模块化，eventBus 和 cache 可以封装起来，最后 export 一个函数，调用时 import 即可
 * 再再再进一步：rollup 构建，umd 模式，支持所有调用方式

 * 思考：错误处理的问题，原函数出错后直接把出错的 uid 过滤掉了，考虑真实情况，可以返回一个错误标志的对象，如 { uid: uid, error: true, e: '出错啦' } 然后调用者进行相应的处理
 * 思考：去重，es6 可以用 Set

 * 改进：如何在初始化时更快的获取数据／性能优化／错误处理

 * 优化1: 实例化时可以选择性的预缓存 user profile
 * 优化2: 每个 get 都可以 handle 到相应的 error，整个接口出错也可获取到错误
 * 优化3: for 循环优化，仅剩两次，一次获取完数据单独触发 done 事件，一次有出错单独触发 error 事件
 * 优化4: 有缓存时直接返回，不等待 debounce 完成
 * 优化5: 收集 100 个 uid，立即请求数据，不等待全部 uid 收集完毕
 * 优化6: 精简了代码，减少不必要的函数调用，嵌套，额外判断等
 */

import EventBus from './event-bus.js';
import Cache from './cache.js';

import requestUserProfile from './request-user-profile.js';

const ProfileCache = new Cache();
const Event = new EventBus();

class GetUserProfile {
	constructor(options = {}) {
		this.options = Object.assign({
			preLoadList: []
		}, options);
		// 预请求列表合并到队列中并去重
		this.queue = [...new Set(this.options.preLoadList)];
		this.debounceCollect = this.debounce((callback = function() {}) => callback(), 100);
		// 预请求
		this.debounceCollect(this.request.bind(this, this.queue));
	}
	get(id, noCache) {
		return new Promise((resolve, reject) => {
			let possibleCachedVal = ProfileCache.get(id);
			// 缓存命中，直接返回
			if (possibleCachedVal) {
				return resolve(possibleCachedVal);
			}
			// 防止重复
			if (this.queue.indexOf(id) === -1) this.queue.push(id);
			Event.on('done' + id, profile => {
				resolve(profile);
			});
			Event.on('error' + id, err => {
				reject(err);
			});
			this.debounceCollect(() => {
				// 全部 uid 收集完毕，或者完成了 100 个的收集任务，快马加鞭开始请求接口
				let uidList = [...this.queue];
				// 置空，等着后面的 push
				this.queue = [];
				this.request(uidList, (e) => {
					if (e) return reject(e);
				});
			});
		});
	}
	clear() {
		// clear all cache
		ProfileCache.deleteAll();
	}
	request(uidList = [], cb = function() {}) {
		let result = {};
		requestUserProfile(uidList)
			.then(profiles => {
				profiles.forEach(item => {
					result[item.uid] = item;
					// 剩下的都是获取数据出错的 uid
					uidList.splice(uidList.indexOf(item.uid), 1);
					// 缓存起来
					ProfileCache.set(item.uid, item);
					// 触发完成
					Event.emit('done' + item.uid, item);
				});
				// 获取失败的 uid 列表
				uidList.forEach(item => {
					Event.emit('error' + item, {
						uid: item,
						error: true // 错误标识
					});
				});
			})
			.catch(e => {
				cb(e, result);
			});
	}
	debounce(func, wait, immediate) {
		const VM = this;
		let timeout;
		return function() {
			const _this = this;
			const args = arguments;

			function later() {
				timeout = null;
				if (!immediate) func.apply(_this, args);
			};
			// 增加 100 个收集完成 flag
			const callNow = (immediate && !timeout) || (VM.queue.length >= 100);
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(_this, args);
		};
	};
}

export default GetUserProfile;
