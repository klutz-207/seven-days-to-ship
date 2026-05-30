# Art Asset Library

本目录用于集中管理游戏美术素材。前端调用素材时优先使用这里的稳定路径，不要把图片散落在组件目录里。

## 通用规格

- 格式：PNG
- 背景：透明背景
- 角色基准尺寸：`128x128` 或 `256x256`
- 像素风要求：清晰像素边缘，避免柔和手绘、厚涂、3D、写实渲染
- 文件命名：小写英文 + 连字符，例如 `walk-down-01.png`
- 每组动画帧保持同一画布尺寸、同一脚底基线、同一角色中心点

## 角色素材

主角普通程序员素材放在：

```txt
assets/characters/programmer/
```

推荐最小移动帧：

```txt
idle-down-01.png
idle-up-01.png
idle-left-01.png
idle-right-01.png

walk-down-01.png
walk-down-02.png
walk-down-03.png
walk-down-04.png

walk-up-01.png
walk-up-02.png
walk-up-03.png
walk-up-04.png

walk-left-01.png
walk-left-02.png
walk-left-03.png
walk-left-04.png

walk-right-01.png
walk-right-02.png
walk-right-03.png
walk-right-04.png
```

如果为了省素材量，`walk-right-*` 可以由前端水平镜像 `walk-left-*` 得到。但如果角色有斜挎包、工牌、发型偏分等明显不对称细节，建议单独生成右向帧。

## 房间素材

房间素材放在：

```txt
assets/rooms/
```

推荐：

```txt
computer-room.png
desk-room.png
cafe-room.png
bedroom-room.png
showroom-room.png
```

## UI 素材

UI 图标放在：

```txt
assets/ui/
```

推荐：

```txt
continue.png
interrupt.png
remind.png
approve.png
pressure.png
selfhood.png
trust.png
focus.png
```

## 特效素材

路径点亮、交互反馈等素材放在：

```txt
assets/effects/
```

推荐：

```txt
path-light-01.png
path-light-02.png
path-light-03.png
```
