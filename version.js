const { execSync } = require('child_process')

console.log('开始生成新版本...')
try {
  execSync('npx standard-version --release-as patch', { stdio: 'inherit' })
  console.log('版本发布完成！')
} catch (error) {
  console.error('版本发布失败:', error.message)
}