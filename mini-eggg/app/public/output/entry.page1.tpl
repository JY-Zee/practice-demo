<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{name}}</title>
  <link href="/static/normalize.css" rel="stylesheet">
  </link>
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>


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
    axios.get('/api/project/list').then(res => {
      console.log(res)
    })
  }
</script>

</html>