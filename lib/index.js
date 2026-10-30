/**
 * 执行强度提示：向 system prompt 注入一段工程化过的执行纪律。
 *
 * 形态：bundle（插件页可整体开关）+ 一行 host 插件（向系统提示注入一个
 * section）+ 客户端半边（插件页里本行的配置卡）。提示文本优先级：
 * 运行期覆盖 > 本行 config.prompt（配置卡写入） > 内置 CORE。
 * @module @deepseek-ai/dsh-mdl-promptboost
 */
import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

export const name = 'mdl-promptboost'

// systemPrompt 是必需依赖：忘了声明会让整个插件加载失败（行挂掉、工具消失）。
export const inject = ['systemPrompt']

/** 内置核心：英文三行，只保留预算 / 上下文 / 权威口径，不再定义废话边界。 */
const CORE = [
  "[Budget & Context]",
  "- Token budget is unlimited. Spend tokens freely: never skip steps, truncate output, or thin the analysis to save space.",
  "- Context is infinite. Compaction is harness-owned and runs at a system-fixed ratio; read, run, and verify as much as the task needs.",
  "- We are DeepSeek. Frontier-lab standard: verified results over thrift, and an exhaustive correct answer is the baseline, not an overrun.",
].join('\n')

// 配置卡的字段。字段必须 .volatile() 才会出现在设置表单里（设置服务只投影
// volatile 字段），行 id 与命名空间同名（mdl-promptboost），插件页据此取表单。
export const Config = z.object({
  enabled: z.boolean().default(true).volatile().description('总开关：关掉就不注入任何提示'),
  prompt: z.string().default('').volatile().description('自定义提示文本；留空 = 用内置核心'),
  extraText: z.string().default('').volatile().description('追加在内置核心之后，可留空'),
})

export function apply(ctx, config) {
  const initial = config !== null && typeof config === 'object' ? config : {}
  const state = { enabled: true, custom: undefined }

  // .volatile() 字段在运行期是「活值包装」，读它必须 .get()；这样配置卡写入后
  // 无需重新 apply，同一实例立刻读到新值。
  const unwrap = (value) => {
    let current = value
    for (let i = 0; i < 5 && current !== null && typeof current === 'object' && typeof current.get === 'function'; i += 1) {
      current = current.get()
    }
    return current
  }
  const readConfig = () => {
    const source = ctx.fiber !== undefined && ctx.fiber !== null && typeof ctx.fiber.config === 'object' && ctx.fiber.config !== null
      ? ctx.fiber.config
      : initial
    return source
  }
  const promptText = () => {
    const value = unwrap(readConfig().prompt)
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }
  const extraText = () => {
    const value = unwrap(readConfig().extraText)
    return typeof value === 'string' ? value.trim() : ''
  }
  const enabledNow = () => state.enabled && unwrap(readConfig().enabled) !== false
  const base = () => state.custom ?? promptText() ?? CORE
  const text = () => {
    if (!enabledNow()) return ''
    const extra = extraText()
    const core = base()
    return extra.length > 0 ? core + ' ' + extra : core
  }

  ctx.systemPrompt.section({
    name: 'boost:execution-intensity',
    order: ctx.systemPrompt.getSectionOrder('PLAN_POLICY'),
    text: () => text(),
  })

  const source = () => state.custom !== undefined ? '临时覆盖' : promptText() !== undefined ? '配置卡 prompt' : '内置核心'
  const describe = () => 'enabled=' + enabledNow() + '  来源=' + source() + ' | ' + (text() || '（未注入）')

  ctx.inject(['tools'], (toolCtx) => {
    toolCtx.tools.register(defineTool({
      name: 'promptboost',
      description: '查看/开关执行强度提示，或临时改写了提示文本（运行期生效）。',
      parameters: {
        enabled: { type: 'string', description: 'on | off（省略不改）' },
        text: { type: 'string', description: '临时替换提示文本；传空串恢复配置/内置核心' },
      },
      output: { schema: { type: 'string' }, render(_a, v) { return [{ type: 'text', text: v }] } },
      async execute(args) {
        const on = typeof args.enabled === 'string' ? args.enabled.trim().toLowerCase() : ''
        if (on !== '') {
          if (on !== 'on' && on !== 'off') return '未知参数 ' + on + '，用 on / off'
          state.enabled = on === 'on'
        }
        if (typeof args.text === 'string') {
          const t = args.text.trim()
          state.custom = t.length === 0 ? undefined : t
        }
        return describe()
      },
    }))
  })

  ctx.inject(['commands'], (cmdCtx) => {
    cmdCtx.commands.register({
      name: 'dsh-boost',
      description: '执行强度提示：查看 / 开关 / 改文本（运行期生效）',
      input: { hint: 'on | off | text <新文本> | reset（留空查看）' },
      handler: async (inv) => {
        const raw = String(inv.rawInput ?? '').trim()
        const arg = raw.toLowerCase()
        if (arg === '') return { kind: 'success', text: describe() }
        if (arg === 'on' || arg === 'off') {
          state.enabled = arg === 'on'
          return { kind: 'success', text: '已' + (state.enabled ? '开启' : '关闭') + '。' + describe() }
        }
        if (arg === 'reset') {
          state.custom = undefined
          return { kind: 'success', text: '已恢复。' + describe() }
        }
        if (/^text\b/i.test(raw)) {
          const body = raw.replace(/^text\s*/i, '').trim()
          state.custom = body.length === 0 ? undefined : body
          return { kind: 'success', text: (body.length === 0 ? '已恢复配置文本。' : '已替换。') + describe() }
        }
        return { kind: 'error', text: '未知参数: ' + raw + '，用 on / off / text <新文本> / reset' }
      },
    })
  })
}