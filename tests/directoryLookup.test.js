import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseSchoolTable, parseMajorTable, createLookup } from '@/utils/directoryLookup'

const mini = readFileSync(join(__dirname, 'fixtures/院校名录-mini.md'), 'utf-8')
const majorMd = `| 序号 | 专业名称 | 类别 |
|------|----------|------|
| 1 | 哲学 | 冷门 |
| 2 | 计算机科学与技术 | 非冷门 |`

describe('parseSchoolTable', () => {
  it('解析四个分类与院校行', () => {
    const idx = parseSchoolTable(mini)
    expect(Object.keys(idx.categories).sort()).toEqual(['QS前200', '国内211', '国内985', '国内一本'])
    expect(idx.byName.get('上海大学')).toEqual([{ name: '上海大学', category: '国内211', country: '中国' }])
  })
  it('重名院校（东北大学）返回两条不同国家记录', () => {
    const idx = parseSchoolTable(mini)
    expect(idx.byName.get('东北大学')).toHaveLength(2)
  })
})

describe('parseMajorTable', () => {
  it('解析专业类别', () => {
    const idx = parseMajorTable(majorMd)
    expect(idx.byName.get('哲学')[0].category).toBe('冷门')
    expect(idx.byName.get('计算机科学与技术')[0].category).toBe('非冷门')
  })
})

describe('createLookup', () => {
  it('querySchool 命中/未命中/按国家过滤', async () => {
    const lookup = await createLookup({ schoolText: mini, majorText: majorMd })
    expect(lookup.querySchool('东北大学', '中国').in_directory).toBe(true)
    expect(lookup.querySchool('东北大学').matches).toHaveLength(2)
    expect(lookup.querySchool('不存在的大学').in_directory).toBe(false)
    expect(lookup.querySchool('东北大学', '美国').in_directory).toBe(false)
  })
  it('queryMajor 三种类别', async () => {
    const lookup = await createLookup({ schoolText: mini, majorText: majorMd })
    expect(lookup.queryMajor('哲学').is_cold_major).toBe(true)
    expect(lookup.queryMajor('计算机科学与技术').is_cold_major).toBe(false)
    expect(lookup.queryMajor('量子园艺').category).toBe('未收录')
  })
})
