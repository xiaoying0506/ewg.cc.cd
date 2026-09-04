let map, geolocation, walking, bleCharacteristic;

// 1. 初始化高德地图与手机 GPS 定位
map = new AMap.Map('map-container', { zoom: 14 });

AMap.plugin(['AMap.Geolocation', 'AMap.Walking'], function() {
  // 开启手机高精度实时定位
  geolocation = new AMap.Geolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    autoMove: true,
    showMarker: true // 在地图上显示当前人所在的位置蓝点
  });
  map.addControl(geolocation);

  // 监听手机位置变化（实时 GPS 改变）
  geolocation.watchPosition();
  AMap.event.addListener(geolocation, 'result', onLocationChanged);
});

// 2. 网页连接手环蓝牙 (Web Bluetooth API)
document.getElementById('connect-ble').addEventListener('click', async () => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['0000fee7-0000-1000-8000-00805f9b34fb'] // 替换为你手环实际的 BLE Service UUID
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000fee7-0000-1000-8000-00805f9b34fb');
    bleCharacteristic = await service.getCharacteristic('0000fef1-0000-1000-8000-00805f9b34fb');
    alert('手环蓝牙连接成功！');
  } catch (err) {
    console.error('蓝牙连接失败:', err);
  }
});

// 3. 实时位置更新回调：重新计算导航并将最新导航指引发给手环
function onLocationChanged(data) {
  const currentLngLat = [data.position.getLng(), data.position.getLat()];
  const destName = document.getElementById('dest-input').value;

  if (destName && bleCharacteristic) {
    // 规划从当前 GPS 位置到目的地的步行路线
    walking = new AMap.Walking({ map: map });
    walking.search(currentLngLat, destName, function(status, result) {
      if (status === 'complete') {
        const route = result.routes[0];
        const currentStep = route.steps[0]; // 当前最近的一个导航动作

        // 组装极简数据包，通过蓝牙发给手环
        const navPayload = JSON.stringify({
          type: 'NAV_START',
          destName: destName,
          distanceText: route.distance + '米',
          estimatedTime: Math.ceil(route.time / 60) + '分钟',
          currentInstruction: currentStep.instruction
        });

        // 写入蓝牙通道
        const encoder = new TextEncoder();
        bleCharacteristic.writeValue(encoder.encode(navPayload));
      }
    });
  }
}
