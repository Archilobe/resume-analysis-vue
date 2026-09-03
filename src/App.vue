<template>
  <el-config-provider>
    <router-view />
  </el-config-provider>
</template>

<style>
body { margin: 0; background: var(--el-fill-color-lighter); }
@page { size: A4; margin: 12mm; }
@media print { body { background: #fff; } }
</style>
