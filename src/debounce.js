// promise 版 节流函数
export default function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		const _this = this;
		const args = arguments;
		return new Promise((resolve, reject) => {
			function later() {
				timeout = null;
				if (!immediate) {
					run().then((res) => resolve(res)).catch(e => {
						reject(e);
					});
				}
			};

			function run() {
				return func.apply(_this, args);
			}
			const callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				run().then((res) => resolve(res)).catch(e => {
					reject(e);
				});
			}
		});
	};
};
