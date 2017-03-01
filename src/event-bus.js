// 事件广播
class EventBus {
	constructor() {
		this.cache = {};
	}
	on(key, func) {
		(this.cache[key] || (this.cache[key] = [])).push(func);
	}
	once(key, func) {
		function on() {
			this.off(key, on);
			func.apply(this, arguments);
		}
		this.on(key, on);
	}
	off(key) {
		this.cache[key] = null;
	}
	emit(key) {
		const args = [...arguments];
		args.shift();
		const stack = this.cache[key];
		if (stack && stack.length > 0) {
			stack.forEach(item => {
				item.apply(this, args);
			});
		}
	}
}

export default EventBus;
