import chalk from 'chalk'

const _stdout = process.stdout
const _stderr = process.stderr

const LEVELS = {
  debug:   { priority: 10, label: 'DEBUG',   icon: '🐛', color: chalk.gray },
  info:    { priority: 20, label: 'INFO',     icon: '📌', color: chalk.cyan },
  success: { priority: 25, label: 'SUCCESS',  icon: '✅', color: chalk.green },
  warn:    { priority: 30, label: 'WARN',     icon: '⚠️', color: chalk.yellow },
  error:   { priority: 40, label: 'ERROR',    icon: '❌', color: chalk.red },
}

const envLevel = (process.env.LOG_LEVEL || 'debug').toLowerCase()
const currentLevelPriority = envLevel === 'silent'
  ? Infinity
  : (LEVELS[envLevel]?.priority ?? LEVELS.debug.priority)

function timestamp() {
  return new Date().toLocaleTimeString('id-ID', { hour12: false })
}

function formatMessage(levelConfig, tag, message) {
  const time = chalk.dim(`[${timestamp()}]`)
  const lvlStr = chalk.bold(levelConfig.color(`[${levelConfig.label}]`))
  const icon = levelConfig.icon
  const tagStr = tag?.trim()
    ? levelConfig.color(`[${String(tag).toUpperCase()}]`) + ' '
    : ''

  const msgStr = message instanceof Error
    ? message.message
    : typeof message === 'object'
      ? JSON.stringify(message, null, 2)
      : String(message)

  return `${time} ${icon} ${lvlStr} ${tagStr}${msgStr}`
}

function shouldLog(priority) {
  return priority >= currentLevelPriority
}

function write(output, isError = false) {
  const stream = isError ? _stderr : _stdout
  stream.write(output + '\n')
}

function logError(tag, error) {
  if (!shouldLog(LEVELS.error.priority)) return
  const message = error instanceof Error ? error.message : String(error)
  write(formatMessage(LEVELS.error, tag, message), true)
  if (error instanceof Error && error.stack) {
    const stack = error.stack.split('\n').slice(1).join('\n')
    write(chalk.dim(stack), true)
  }
}

function pairing(code) {
  const border = chalk.bold.cyan
  const codeColor = chalk.bold.yellow
  const line = '═'.repeat(52)
  const spaced = String(code).split('').join(' ')

  const output = [
    '',
    `${border('╔')}${border(line)}${border('╗')}`,
    `${border('║')}${'  📱 PAIRING CODE'.padEnd(52)}${border('║')}`,
    `${border('╠')}${border(line)}${border('╣')}`,
    `${border('║')}  ${codeColor(spaced)}${' '.repeat(50 - spaced.length)}${border('║')}`,
    `${border('╠')}${border(line)}${border('╣')}`,
    `${border('║')}${'  ⏰ Berlaku 60 detik'.padEnd(52)}${border('║')}`,
    `${border('╚')}${border(line)}${border('╝')}`,
    '',
  ].join('\n')

  _stdout.write(output + '\n')
}

const logger = {
  info(tag, message) {
    if (!shouldLog(LEVELS.info.priority)) return
    write(formatMessage(LEVELS.info, tag, message))
  },

  success(tag, message) {
    if (!shouldLog(LEVELS.success.priority)) return
    write(formatMessage(LEVELS.success, tag, message))
  },

  warn(tag, message) {
    if (!shouldLog(LEVELS.warn.priority)) return
    write(formatMessage(LEVELS.warn, tag, message), true)
  },

  error(tag, error) {
    logError(tag, error)
  },

  debug(tag, message) {
    if (!shouldLog(LEVELS.debug.priority)) return
    write(formatMessage(LEVELS.debug, tag, message))
  },

  pairing,
}

export default logger