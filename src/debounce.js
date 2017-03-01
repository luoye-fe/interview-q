// promise 版 节流函数
export default function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		const _this = this;
		const args = arguments;
		return new Promise((resolve, reject) => {
			function later() {
				timeout = null;
				if (!immediate) resolve(func.apply(_this, args));
			};
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) resolve(func.apply(_this, args));
		});
	};
};
