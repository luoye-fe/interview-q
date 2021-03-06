//现在有一个 Ajax 接口，根据用户 uid 获取用户 profile 信息，是一个批量接口。我把这个 ajax 请求封装成以下的异步函数
var requestUserProfile = function(uidList) { // uidList 是一个数组，最大接受 100 个 uid
    console.log('走接口啦', uidList.toString());
    // 这个方法的实现不能修改

    /** 先去重 */
    var uidList = uidList || [];
    var _tmp = {};
    var _uidList = [];
    uidList.forEach(function(uid) {
        if (!_tmp[uid]) {
            _tmp[uid] = 1;
            _uidList.push(uid);
        }
    })
    _tmp = null;
    uidList = null;

    return Promise.resolve().then(function() {
        return new Promise(function(resolve, reject) {
            setTimeout(function() { // 模拟 ajax 异步，1s 返回
                resolve();
            }, 1000);
        }).then(function() {
            var profileList = _uidList.map(function(uid) {
                if (uid < 0) { // 模拟 uid 传错，服务端异常，获取不到部分 uid 对应的 profile 等异常场景
                    return null;
                } else {
                    return {
                        uid: uid,
                        nick: uid + 'Nick',
                        age: 18
                    }
                }
            });
            return profileList.filter(function(profile) {
                return profile !== null;
            });
        });
    });
}

// 现在我们有很多业务都需要根据 uid 获取 userProfile , 大多数业务的需求都是给一个 uid，获取 profile 。为了性能，我们需要把这个单个的请求合并成批量请求。

// 例如，现在页面上 A 模块需要获取 uid 为 1 的 profile，B 模块需要 uid 为 2 的 profile， C 模块需要获取 uid 为 1 的profile
// 这三个模块会单独调用下面这个方法获取 profile，假设这三次调用的时间非常接近(100ms 以内)，最终要求只发送一个 ajax 请求（只调用一次 requestUserProfile )，拿到这三个模块需要的 profile

// 完成以下方法，接收一个参数 uid，返回一个 Promise，当成功请求到 profile 的时候， resolve 对应的profile , 请求失败 reject
// 例如  getUserProfile(1).then(function(profile){ console.log(profile.uid === 1) // true });  // 假设请求成功了。


/*
 * 基本：先用节流函数将在设定时间间隔内的请求收集起来一起执行，多余100个的请求先处理100个，剩下的递归调用，每次处理100个，获取数据完毕之后用广播机制告知每个调用者相对应的数据，
 * 进一步：本地缓存一份已知的 profile list，设定缓存时间，缓存时间内不发起真实请求，从本地取
 * 再进一步：ES6 来实现
 * 再再进一步：模块化，eventBus 和 cache 可以封装起来，最后 export 一个函数，调用时 import 即可
 * 再再再进一步：rollup 构建，umd 模式，支持所有调用方式
 * 思考：错误处理的问题，原函数出错后直接把出错的 uid 过滤掉了，考虑真实情况，可以返回一个错误标志的对象，如 { uid: uid, error: true, e: '出错啦' } 然后调用者进行相应的处理
 * 思考：去重，es6 可以用 Set
 */


// promise 版 节流函数
function debounce(func, wait, immediate) {
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

class TaskQ {
    constructor() {
        this.queue = []; // id 列表
        this.debounceRun = debounce(this.runRealReQuest, 100);
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
            });
    }
    loop(profiles) {
        // 触发 'done' 事件，通知调用者执行回调
        ProfileEventBus.emit('done', profiles);
        this.queue = [];
        // 大于100个的请求递归调用，直到 extraQueue 里没有内容
        if (this.extraQueue.length) {
            this.queue = this.extraQueue.splice(0, 100);
            this.run();
        }
    }
    runRealReQuest() {
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
                            // 设置缓存
                            ProfileCache.set(profiles[i].uid, profiles[i]);
                        }
                        resolve(result.concat(profiles));
                    })
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
function getUserProfile(id) {
    return new Promise((resolve, reject) => {
        // 向队列中添加 id
        ProfileRequetTaskQ.add(id);
        // 监听本次队列的 done 事件
        ProfileEventBus.on('done', profiles => {
            for (let i in profiles) {
                // uid 与 id 一致的 返回给调用者 (warning: uid 为 0 的时候！！！)
                if (profiles[i].uid !== undefined && profiles[i].uid === id) return resolve(profiles[i]);
            }
        });
    });
}


// 业务逻辑
for (let i = 0; i < 205; i++) { // 测试大于 100 个的情景
    (function(item) {
        getUserProfile(item)
            .then(res => {
                console.log(item, res);
            });
    })(i)
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
