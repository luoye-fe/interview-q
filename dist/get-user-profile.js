/*
 * GetUserProfile v1.0.0
 * (c) 2017 luoye <luoyefe@gmail.com>
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.GetUserProfile = factory());
}(this, (function () { 'use strict';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();





var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get$1 = function get$1(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get$1(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set$1 = function set$1(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set$1(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

// 事件广播
var EventBus = function () {
	function EventBus() {
		classCallCheck(this, EventBus);

		this.cache = {};
	}

	createClass(EventBus, [{
		key: "on",
		value: function on(key, func) {
			(this.cache[key] || (this.cache[key] = [])).push(func);
		}
	}, {
		key: "once",
		value: function once(key, func) {
			function on() {
				this.off(key, on);
				func.apply(this, arguments);
			}
			this.on(key, on);
		}
	}, {
		key: "off",
		value: function off(key) {
			this.cache[key] = null;
		}
	}, {
		key: "emit",
		value: function emit(key) {
			var _this = this;

			var args = [].concat(Array.prototype.slice.call(arguments));
			args.shift();
			var stack = this.cache[key];
			if (stack && stack.length > 0) {
				stack.forEach(function (item) {
					item.apply(_this, args);
				});
			}
		}
	}]);
	return EventBus;
}();

// 缓存
// 直接存放在内存中，放到 ls 中也可
var Cache = function () {
	function Cache(options) {
		classCallCheck(this, Cache);

		this.options = options || {};
		this.cacheMs = this.options.cacheMs || 60 * 1000; // 默认缓存时间一分钟
		this.cache = {};
	}

	createClass(Cache, [{
		key: "set",
		value: function set(key, value, ms) {
			// ms 可单独设置缓存时间
			this.cache[key] = {
				val: value,
				setTime: Date.now(),
				cacheTime: ms || this.cacheMs
			};
		}
	}, {
		key: "get",
		value: function get(key) {
			this.check(key);
			return this.cache[key] ? this.cache[key].val : null;
		}
	}, {
		key: "delete",
		value: function _delete(key) {
			delete this.cache[key];
		}
	}, {
		key: "deleteAll",
		value: function deleteAll() {
			this.cache = {};
		}
	}, {
		key: "check",
		value: function check(key) {
			// 检测是否过期，过期了删除
			var cur = this.cache[key];
			if (cur && Date.now() - cur.setTime > cur.cacheTime) this.delete(key);
		}
	}]);
	return Cache;
}();

// 现在有一个 Ajax 接口，根据用户 uid 获取用户 profile 信息，是一个批量接口。我把这个 ajax 请求封装成以下的异步函数
function requestUserProfile(uidList) {
	// uidList 是一个数组，最大接受 100 个 uid
	console.log('走接口啦', uidList.toString());
	// 这个方法的实现不能修改

	/** 先去重 */
	var uidList = uidList || [];
	var _tmp = {};
	var _uidList = [];
	uidList.forEach(function (uid) {
		if (!_tmp[uid]) {
			_tmp[uid] = 1;
			_uidList.push(uid);
		}
	});
	_tmp = null;
	uidList = null;

	return Promise.resolve().then(function () {
		return new Promise(function (resolve, reject) {
			setTimeout(function () {
				// 模拟 ajax 异步，1s 返回
				resolve();
			}, 1000);
		}).then(function () {
			var profileList = _uidList.map(function (uid) {
				if (uid < 0) {
					// 模拟 uid 传错，服务端异常，获取不到部分 uid 对应的 profile 等异常场景
					return null;
				} else {
					return {
						uid: uid,
						nick: uid + 'Nick',
						age: 18
					};
				}
			});
			return profileList.filter(function (profile) {
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

 * 改进：如何在初始化时更快的获取数据／性能优化／错误处理

 * 优化1: 实例化时可以选择性的预缓存 user profile
 * 优化2: 每个 get 都可以 handle 到相应的 error，整个接口出错也可获取到错误
 * 优化3: for 循环优化，仅剩两次，一次获取完数据单独触发 done 事件，一次有出错单独触发 error 事件
 * 优化4: 有缓存时直接返回，不等待 debounce 完成
 * 优化5: 收集 100 个 uid，立即请求数据，不等待全部 uid 收集完毕
 * 优化6: 精简了代码，减少不必要的函数调用，嵌套，额外判断等
 */

var ProfileCache = new Cache();
var Event = new EventBus();

var GetUserProfile = function () {
	function GetUserProfile() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		classCallCheck(this, GetUserProfile);

		this.options = Object.assign({
			preLoadList: []
		}, options);
		// 预请求列表合并到队列中并去重
		this.queue = [].concat(toConsumableArray(new Set(this.options.preLoadList)));
		this.debounceCollect = this.debounce(function () {
			var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};
			return callback();
		}, 100);
		// 预请求
		if (this.queue.length) this.debounceCollect(this.request.bind(this, this.queue));
	}

	createClass(GetUserProfile, [{
		key: 'get',
		value: function get(id, noCache) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				var possibleCachedVal = ProfileCache.get(id);
				// 缓存命中，直接返回
				if (possibleCachedVal) return resolve(possibleCachedVal);
				// 防止重复
				if (_this2.queue.indexOf(id) === -1) _this2.queue.push(id);
				Event.on('done' + id, function (profile) {
					resolve(profile);
				});
				Event.on('error' + id, function (err) {
					reject(err);
				});
				_this2.debounceCollect(function () {
					// 全部 uid 收集完毕，或者完成了 100 个的收集任务，快马加鞭开始请求接口
					var uidList = [].concat(toConsumableArray(_this2.queue));
					// 置空，等着后面的 push
					_this2.queue = [];
					_this2.request(uidList, function (e) {
						if (e) return reject(e);
					});
				});
			});
		}
	}, {
		key: 'clear',
		value: function clear() {
			// clear all cache
			ProfileCache.deleteAll();
		}
	}, {
		key: 'request',
		value: function request() {
			var uidList = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
			var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

			var result = {};
			requestUserProfile(uidList).then(function (profiles) {
				profiles.forEach(function (item) {
					result[item.uid] = item;
					// 剩下的都是获取数据出错的 uid
					uidList.splice(uidList.indexOf(item.uid), 1);
					// 缓存起来
					ProfileCache.set(item.uid, item);
					// 触发完成
					Event.emit('done' + item.uid, item);
				});
				// 获取失败的 uid 列表
				uidList.forEach(function (item) {
					Event.emit('error' + item, {
						uid: item,
						error: true // 错误标识
					});
				});
			}).catch(function (e) {
				cb(e, result);
			});
		}
	}, {
		key: 'debounce',
		value: function debounce(func, wait, immediate) {
			var VM = this;
			var timeout = void 0;
			return function () {
				var _this = this;
				var args = arguments;

				function later() {
					timeout = null;
					if (!immediate) func.apply(_this, args);
				}
				// 增加 100 个收集完成 flag
				var callNow = immediate && !timeout || VM.queue.length >= 100;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(_this, args);
			};
		}
	}]);
	return GetUserProfile;
}();

return GetUserProfile;

})));
