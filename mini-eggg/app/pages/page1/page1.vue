<template>
  <div>
    <h1>Page1</h1>
    <input v-model="content" />
    <div>{{ content }}</div>
  </div>
</template> 
<script setup>
import { ref } from 'vue'
import utils from '$common/utils'

utils.add(1, 2)

const content = ref('')

console.log('page1 init', utils)

</script>
<style scoped lang="less">
h1 {
  color: red;
}
</style>