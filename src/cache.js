// 缓存
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
		this.check();
	}
	get(key) {
		this.check();
		return this.cache[key] ? this.cache[key].val : null;
	}
	delete(key) {
		delete this.cache[key];
	}
	check() {
		// 检测是否过期，过期了删除
		Object.keys(this.cache).forEach(item => {
			let cur = this.cache[item];
			if (cur && (Date.now() - cur.setTime) > cur.cacheTime) this.delete(item);
		});
	}
}

export default Cache;
