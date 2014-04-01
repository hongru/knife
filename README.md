# lib.Knife

基于Canvas的切割刀光实现

## Usage

```javascript
knife = new lib.Knife({
	canvas: 'canvas',
	knifeMode: 'fill',
	color: 'red'
});
```
注意，请在每帧渲染的代码中调用实例的render方法 `knife.render()` 来渲染刀光。
例如：
```javascript
function run () {
	ctx.clearRect(0,0,canvas.width,canvas.height);
	knife.render(); //调用knife实例的render，渲染刀光。为了保证刀光在canvas渲染的最上层，请在每帧render的最后调用`knife.render`
	requestAnimationFrame(run);
}
```

## Option
```javascript
new lib.Knife({ 
	canvas: 'canvasId', //canvas元素的id或者 canvasElement
	pointLife: 300, //刀光的生存时长，可选
	knifeMode: 'line', // 刀光的样式，'line' 或者 'fill' ，默认为'line'
	color: '#fff', // 刀光颜色. 可选，默认 白色
	widthStep: 0.5 // 刀光从细到粗的步进， 可选，默认0.5
})
```

