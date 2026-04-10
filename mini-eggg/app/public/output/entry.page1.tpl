<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
  <link href="/static/normalize.css" rel="stylesheet">
  </link>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <script src="
  https://cdn.jsdelivr.net/npm/js-md5@0.8.3/src/md5.min.js
  "></script>

</head>

<body>
  page1
  <div>
    <input id="name" value={{name}} style="display: none"></input>
    <input id="env" value={{env}} style="display: none"></input>
    <button onclick="handleClick()">发送按钮</button>
  </div>
</body>

<script type=" text/javascript">
  try {
    window.name = document.getElementById('name').value
    window.env = document.getElementById('env').value
  } catch (e) {
    console.log(e)
  }


  const handleClick = () => {
    // 生成签名
    const  key = '1234567890';
    const st = Date.now();
    const sSign = md5(`${key}_${st}`);

    axios.request({
      method: 'POST',
      url: '/api/project/list?proj_key=21',
      data : {a: 1, b:2 , c: 3},
      headers: {
        's_sign': sSign,
        's_t': st
      }
    }).then(res => {
    })
  }
</script>

</html>