;(function (win, lib) {

	function extend (target, source, isOverwrite) {
		if (isOverwrite == undefined) isOverwrite = true;
		for (var k in source) {
			if (!(k in target) || isOverwrite) {
				target[k] = source[k];
			}
		}
		return target;
	}

	function getLength (p0, p1) {
		return Math.sqrt(Math.pow(p1.x-p0.x, 2) + Math.pow(p1.y-p0.y, 2));
	}
	function getNormal (p0, p1) {
		var l = getLength(p0, p1);
		return [(p1.x-p0.x)/l, (p1.y-p0.y)/l];
	}
	function getCrossNormal(p0, p1) {
		var nor = getNormal(p0, p1);
		return [nor[1], -nor[0]];
	}
	function offset (el) {
		var obj = el.getBoundingClientRect();
		return {
	        left: obj.left + window.pageXOffset,
	        top: obj.top + window.pageYOffset,
	        width: Math.round(obj.width),
	        height: Math.round(obj.height)
	    };
	}
	function getCanvasScale (el) {
		return {
			scaleX: el.offsetWidth/el.width,
			scaleY: el.offsetHeight/el.height
		}
	}

	var Knife = function (opt) {
		var _defaults = {
			pointLife: 300,
			knifeMode: 'line',
			color: '#fff',
			widthStep: 0.5
		};

		opt = extend(_defaults, opt);
		this.opt = opt;

		var canvas;
		if (typeof opt.canvas === 'string') {
			canvas = /^[#]/.test(opt.canvas) ? document.querySelector(opt.canvas) : document.getElementById(opt.canvas);
		} else {
			canvas = opt.canvas;
		}
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.pointLife = this.opt.pointLife;

		this._params = {};
		this.points = [];

		this._bind();
	};
	Knife.prototype = {
		_bind: function () {
			var me = this;
			document.addEventListener('mousedown', function (e) {
				me._onMousedown(e);
			}, false);
			this.canvas.addEventListener('mousemove', function (e) {
				me._onMousemove(e);
			}, false);
			document.addEventListener('mouseup', function (e) {
				me._onMouseup(e);
			}, false);

			document.addEventListener('touchstart', function (e) {
				me._onTouchstart(e);
			}, false);
			this.canvas.addEventListener('touchmove', function (e) {
				me._onTouchmove(e);
			}, false);
			document.addEventListener('touchend', function (e) {
				me._onTouchend(e);
			}, false);
			document.addEventListener('touchcancel', function (e) {
				me._onTouchend(e);
			}, false);
		},
		_onMousedown: function (e) {
			//alert(JSON.stringify(offset(this.canvas)))
			this._params.elOffset = offset(this.canvas);
			this._canvasScale = getCanvasScale(this.canvas);

			this._params.pressDown = true;
			this._params.startX = e.pageX - this._params.elOffset.left;
			this._params.startY = e.pageY - this._params.elOffset.top;
		},
		_onMousemove: function (e) {
			if (!this._params.pressDown) {
				return;
			}
			this.points.push({x:e.pageX-this._params.elOffset.left, y:e.pageY-this._params.elOffset.top, bornTime:Date.now()});
		},
		_onMouseup: function (e) {
			this._params = {};
		},
		_onTouchstart: function (e) {
			var ev = e.changedTouches[0];
			this._onMousedown(ev);
		},
		_onTouchmove: function (e) {
			e.preventDefault();
			this._onMousemove(e.changedTouches[0]);
		},
		_onTouchend: function (e) {
			this._onMouseup(e.changedTouches[0]);
		},

		render: function () {
			var ctx = this.ctx;
			var now = Date.now();
			for (var i = 0; i < this.points.length; i ++) {
				var p = this.points[i];
				if (now - p.bornTime > this.pointLife) {
					this.points.shift();
					i --;
				} else {
					break;
				}
			}

			if (this.opt.knifeMode == 'line') {
				this._renderLineKnife();
			} else {
				this._renderFillKnife();
			}
		},
		_renderLineKnife: function () {
			var ctx = this.ctx;
			var scaleX = 1, scaleY = 1;
			if (this._canvasScale) {
				scaleX = this._canvasScale.scaleX;
				scaleY = this._canvasScale.scaleY;
			}

			if (this.points.length >= 2) {
				var sw = 1;
				for (var i = 0; i < this.points.length; i ++) {
					var p0 = this.points[i],
						p1 = this.points[i + 1];

					if (p1) {
						ctx.save();
						ctx.beginPath();
						ctx.moveTo(p0.x/scaleX, p0.y/scaleY);
						ctx.lineTo(p1.x/scaleX, p1.y/scaleY);
						ctx.lineWidth = sw/scaleX;
						ctx.strokeStyle = this.opt.color;
						ctx.stroke();
						ctx.closePath();

						ctx.restore();	
					}
					sw+=this.opt.widthStep;
					
				}
			}
		},
		_renderFillKnife: function () {
			var ctx = this.ctx;
			var scaleX = 1, scaleY = 1;
			if (this._canvasScale) {
				scaleX = this._canvasScale.scaleX;
				scaleY = this._canvasScale.scaleY;
			}

			if(this.points.length >= 2) {
				var ret = [this.points[0]];
				var ret1 = [],
					ret2 = [];
				var sw = 0.5;
				for (var i = 1; i < this.points.length; i ++) {
					var p = this.points[i];
					var lastP = this.points[i-1];

					var cnor = getCrossNormal(lastP, p);
					var p11 = {
						x: p.x + cnor[0]*sw,
						y: p.y + cnor[1]*sw,
						bornTime: p.bornTime
					};
					var p12 = {
						x: p.x - cnor[0]*sw,
						y: p.y - cnor[1]*sw,
						bornTime: p.bornTime
					};

					ret1.push(p11);
					ret2.unshift(p12);

					if (i == this.points.length-1) {
						//last point
						//sharp head
						var lastNor = getNormal(lastP, p);
						var sharpP = {
							x: p.x + sw*2*lastNor[0],
							y: p.y + sw*2*lastNor[1]
						};
						ret1.push(sharpP);
					}
					sw += this.opt.widthStep;
				}
				ret = ret.concat(ret1).concat(ret2);

				ctx.beginPath();
				ctx.moveTo(ret[0].x/scaleX, ret[0].y/scaleY);
				for (var i = 1; i < ret.length; i ++) {
					ctx.lineTo(ret[i].x/scaleX, ret[i].y/scaleY);
				}
				
				ctx.closePath();
				ctx.fillStyle = this.opt.color;
				ctx.fill();
				// ctx.strokeStyle = '#fff';
				// ctx.stroke();

			}
		}
	};

	lib.Knife = Knife;

})(window, window.lib || (window.lib = {}));