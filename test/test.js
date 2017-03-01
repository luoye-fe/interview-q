/* eslint-disable */
// 业务逻辑
for (let i = 0; i < 205; i++) { // 测试大于 100 个的情景
	(function(item) {
		getUserProfile(item)
			.then(res => {
				console.log(item, res);
			});
	})(i);
}

// getUserProfile(1)
//     .then(res => {
//         console.log(1);
//         console.log(res);
//     });
// getUserProfile(2)
//     .then(res => {
//         console.log(2);
//         console.log(res);
//     });

// setTimeout(function() {
//     // 从缓存走
//     getUserProfile(2)
//         .then(res => {
//             console.log(2);
//             console.log(res);
//         });
//     // 从接口走
//     // getUserProfile(3)
//     //     .then(res => {
//     //         console.log(3);
//     //         console.log(res);
//     //     });
// }, 2000)
