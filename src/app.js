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
 */

import EventBus from './event-bus.js';
import Cache from './cache.js';

import requestUserProfile from './request-user-profile.js';

const ProfileCache = new Cache();
const Event = new EventBus();

class UserProfile {
	constructor(options = {}) {
		this.options = Object.assign({
			preLoadList: []
		}, options);
		this.cacheKey = 'user-profiles';
		// 预请求列表去重
		this.queue = [...new Set(this.options.preLoadList)];
		this.debounceRun = this.debounce(this.request.bind(this), 100);
		this.debounceRun(this.queue);
	}
	get(id, noCache) {
		return new Promise((resolve, reject) => {
			let possibleCachedVal = ProfileCache.get(id);
			if (possibleCachedVal) {
				resolve(possibleCachedVal);
			} else {
				this.queue.push(id);
				Event.on('done' + id, profile => {
					resolve(profile);
				});
				Event.on('error' + id, err => {
					reject(err);
				});
				this.debounceRun(this.queue, (e) => {
					// 接口出错了
					if (e) return reject(e);
				});
			}
		});
	}
	clear() {
		// clear all cache
		ProfileCache.deleteAll();
	}
	request(uidList = [], cb = function() {}) {
		const _this = this;
		let result = {};
		// 去重
		uidList = [...new Set(uidList)];
		loop();
		function loop () {
			// 取出 100 个递归调用
			let extraList = uidList.splice(0, 100);
			requestUserProfile(extraList)
				.then(profiles => {
					profiles.forEach(item => {
						result[item.uid] = item;
						// 剩下的都是获取数据出错的 uid
						extraList.splice(extraList.indexOf(item.uid), 1);
						// 缓存起来
						ProfileCache.set(item.uid, item);
						// 触发完成
						Event.emit('done' + item.uid, item);
					});
					// 获取失败的 uid 列表
					extraList.forEach(item => {
						Event.emit('error' + item, {
							uid: item,
							error: true
						});
					});
					if (uidList.length) return loop();
					_this.queue = [];
				})
				.catch(e => {
					_this.queue = [];
					cb(e, result);
				});
		}
	}
	debounce(func, wait, immediate) {
		let timeout;
		return function() {
			const _this = this;
			const args = arguments;
			function later() {
				timeout = null;
				if (!immediate) func.apply(_this, args);
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(_this, args);
		};
	};
}

export default UserProfile;
