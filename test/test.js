/* eslint-disable */

// 假设需要渲染联系人列表，可以在初始化 app 的时候就调用 UserProfile 实例，并传入可在全局获取的联系人列表，然后提前获取联系人列表的详情，并缓存起来，要用时再从缓存拿
const userProfile = new GetUserProfile({
	preLoadList: [1, 2]
});

userProfile.get(1)
	.then(res => {
		console.log(1, res);
	})
	.catch(e => {
		console.log(e);
	})


// // 业务逻辑
// for (let i = 0; i < 205; i++) { // 测试大于 100 个的情景
// 	(function(item) {
// 		userProfile.get(item)
// 			.then(res => {
// 				console.log(item, res);
// 			})
// 			.catch(e => {
// 				console.log(e);
// 			});
// 	})(i);
// }

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
