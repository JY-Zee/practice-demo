// 环境变量

module.exports = (app) => {
  return {
    // 判断是否本地
    isLocal() {
      return process.env._ENV === "local";
    },
    // 判断是否测试
    isBeta() {
      return process.env._ENV === "beta";
    },
    // 判断是否生产
    isProduction() {
      return process.env._ENV === "production";
    },
    // 获取当前环境
    get() {
      return process.env._ENV || "local";
    },
  };
};
