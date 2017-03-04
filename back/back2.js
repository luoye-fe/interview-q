class TaskQ {
	constructor() {
		this.queue = []; // id 列表
		this.debounceRun = debounce(this.runRealRequest, 100);
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
			})
			.catch(e => {
				this.loop(null, e);
			});
	}
	loop(profiles, error) {
		// handle error
		if (error) return ProfileEventBus.emit('error', error);
		// 触发 'done' 事件，通知调用者执行回调
		for (let i in profiles) {
			// uid 与 id 一致的 返回给调用者 (warning: uid 为 0 的时候！！！)
			if (profiles[i].uid !== undefined) {
				ProfileEventBus.emit('done' + profiles[i].uid, profiles[i]);
			};
		}
		this.queue = [];
		// 大于100个的请求递归调用，直到 extraQueue 里没有内容
		if (this.extraQueue.length) {
			this.queue = this.extraQueue.splice(0, 100);
			this.run();
		}
	}
	runRealRequest() {
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
							// 未出错的设置缓存
							if (!profiles[i].error) {
								ProfileCache.set(profiles[i].uid, profiles[i]);
							}
						}
						// 合并返回
						resolve(result.concat(profiles));
					})
					.catch(e => {
						reject(e);
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
		ProfileEventBus.on('done' + id, profile => {
			resolve(profile);
			// for (let i in profiles) {
			// 	// uid 与 id 一致的 返回给调用者 (warning: uid 为 0 的时候！！！)
			// 	if (profiles[i].uid !== undefined && profiles[i].uid === id) return resolve(profiles[i]);
			// }
		});
		ProfileEventBus.on('error', e => {
			// 处理错误
			reject(e);
		});
	});
}