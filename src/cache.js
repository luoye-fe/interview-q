// 缓存
// 直接存放在内存中，放到 ls 中也可
class Cache {
	constructor(options) {
		this.options = options || {};
		this.cacheMs = this.options.cacheMs || 60 * 1000; // 默认缓存时间一分钟
		this.cache = {};
	}
	set(key, value, ms) { // ms 可单独设置缓存时间
		this.cache[key] = {
			val: value,
			setTime: Date.now(),
			cacheTime: ms || this.cacheMs
		};
	}
	get(key) {
		this.check(key);
		return this.cache[key] ? this.cache[key].val : null;
	}
	delete(key) {
		delete this.cache[key];
	}
	check(key) {
		// 检测是否过期，过期了删除
		let cur = this.cache[key];
		if (cur && (Date.now() - cur.setTime) > cur.cacheTime) this.delete(key);
	}
}

export default Cache;
