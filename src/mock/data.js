// 三份内置示例简历（扁平结构全字段）。warnings 不入库，由引擎实时计算。

const photoUri = (bg, label) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="${bg}"/><text x="60" y="85" font-size="14" fill="#fff" text-anchor="middle">${label}</text></svg>`)}`

export const SEED_RESUMES = [
  {
    id: 'demo-1',
    fileName: '郑前-简历.pdf',
    parsedAt: '2026-09-01 10:12',
    basic: {
      name: '郑前', gender: '女', birthDate: '2000-01-01', highestDegree: '硕士', graduationDate: '2026-06-30',
      workYears: '0年', employmentStatus: '应届毕业生', maritalStatus: '未婚', height: 165, weight: 55,
      overseasEducation: false, country: '中国', householdType: '城镇户口', householdLocation: '上海市浦东新区',
      hometown: '江苏南京', hukouLocation: '上海', ethnicity: '汉族', politicalStatus: '共青团员', formalWorkExperience: '无'
    },
    contact: { phone: '13801234567', email: 'zhengqian@example.com', postcode: '200120', address: '上海市浦东新区世纪大道100号' },
    certificate: { nationality: '中国', idType: '居民身份证', idNumber: '310101200001010022' },
    intention: { currentCity: '上海', targetCities: [], onboardTime: '2026-07', expectSalary: '15k-20k' },
    agreeAdjust: true,
    educationList: [
      { period: '2023.09 - 2026.06', start: '2023-09', end: '2026-06', school: '上海大学', major: '计算机科学与技术', level: '硕士', location: '上海', studyMode: '全日制', rank: '前10%', gpa: '3.7', gpaFull: '4.0', retake: '无', isFullTime: '是' },
      { period: '2019.09 - 2023.06', start: '2019-09', end: '2023-06', school: '上海大学', major: '软件工程', level: '本科', location: '上海', studyMode: '全日制', rank: '前15%', gpa: '3.5', gpaFull: '4.0', retake: '无', isFullTime: '是' }
    ],
    workList: [
      { period: '2025.05 - 2025.09', start: '2025-05', end: '2025-09', company: '九方智投控股', position: '算法实习生', department: '智能技术部', description: '负责大模型 Agent 应用的算法研发与效果调优', achievement: '上线智能投研问答助手，问答准确率提升 12%', reason: '实习期满返校' },
      { period: '2023.09 - 2025.04', start: '2023-09', end: '2025-04', company: '交通银行', position: '算法实习生', department: '金融科技创新研究院', description: '从事 NLP 算法研究与落地，参与智能客服语义理解模块', achievement: '构建意图识别模型，准确率 94%', reason: '升学深造' }
    ],
    projectList: [
      { period: '2025.03 - 2025.09', start: '2025-03', end: '2025-09', name: '心语 Hearsay', description: 'AI 共情对话系统，面向心理疏导场景的多轮对话平台', duty: 'NLP 算法与大模型开发，负责共情回复生成与情感识别' },
      { period: '2024.06 - 2024.12', start: '2024-06', end: '2024-12', name: 'QuickCapture', description: '基于 RAG 的企业知识库快速检索与摘要工具', duty: 'RAG 检索链路设计与 LLM 摘要生成' }
    ],
    practiceList: ['2022.07 - 2022.08 上海市大学生社会实践「智慧社区调研」项目负责人，走访 12 个社区并输出调研报告'],
    campusList: ['2020.09 - 2021.06 校学生会科技部部长，组织 3 届校园编程马拉松'],
    trainingList: ['2024.07 - 2024.08 某大厂「大模型应用开发」实训营，完成 4 个实战项目'],
    skillList: [
      { name: 'LLM 应用开发', level: '精通', years: '2年' },
      { name: 'Python', level: '精通', years: '5年' },
      { name: 'PyTorch', level: '熟练', years: '3年' },
      { name: 'SQL', level: '熟练', years: '3年' }
    ],
    certificateList: [
      { name: '软件设计师（软考中级）', date: '2023-11', org: '工业和信息化部' }
    ],
    languageList: [
      { language: '英语', level: '熟练', certificate: '' }
    ],
    awardList: [
      { name: '全国大学生数学建模竞赛二等奖', date: '2022-11', org: '中国工业与应用数学学会', referee: '王教授', level: '国家级' },
      { name: '校级一等奖学金', date: '2021-10', org: '上海大学', referee: '李老师', level: '校级' }
    ],
    family: { father: {}, mother: {} },
    companyRelatives: { hasRelatives: false, needAvoidance: false },
    photos: [{ name: '生活照1.jpg', url: photoUri('#7c9cd3', '生活照 1') }, { name: '生活照2.jpg', url: photoUri('#89b4a0', '生活照 2') }],
    attachments: [{ name: '成绩单.pdf', size: 512000, url: '#' }, { name: '获奖证书.zip', size: 1048576, url: '#' }],
    selfEvaluation: '对大模型与 NLP 技术有浓厚兴趣，具备扎实的算法功底与工程落地能力，曾在金融与证券两类业务场景完成智能问答系统从 0 到 1 的交付。乐于协作，抗压能力强。',
    interests: '长跑（半马完赛）、围棋（业余 3 段）、技术博客写作',
    extraQuestions: { majorViolation: '无', business: '无', majorIllness: '无' },
    summary: {
      overview: '郑前，女，2000 年生，上海大学计算机科学与技术硕士（2026 届），本硕均为上海大学（国内211，院校名录内），应届未婚。',
      internships: '两段技术实习：交通银行金融科技创新研究院算法实习生（NLP 智能客服）约 19 个月；九方智投控股算法实习生（大模型 Agent）5 个月。两个代表作项目：AI 共情对话系统「心语 Hearsay」与 RAG 知识库工具 QuickCapture。',
      skills: 'LLM 应用开发（精通）、Python（精通）、PyTorch（熟练）、SQL（熟练）；持有软考中级「软件设计师」证书。',
      risks: ['英语能力：语种为英语但未提供证书，需人工核验（规则4）', '意向城市未填写，无法确认是否接受南京工作地点（规则6）', '家庭信息：父亲、母亲信息完全未填写（规则8）']
    },
    interview: {
      directions: ['大模型算法工程', 'NLP 应用研发', '智能问答/Agent 方向'],
      questionGroups: [
        { category: '项目深挖', questions: ['「心语」中共情回复生成用了哪些技术？如何评价共情效果？', 'QuickCapture 的 RAG 链路如何切分、检索与重排？召回率如何优化？'] },
        { category: '工程能力', questions: ['大模型应用上线后出现幻觉，你会从哪些环节治理？', '描述一次模型效果不达预期的排查过程。'] },
        { category: '稳定性与动机', questions: ['两段实习间隔与学业如何安排？', '为何投递南京岗位，是否接受调剂？'] }
      ],
      concerns: ['英语证书缺失需当面核验或补充材料', '家庭信息未填写，需按招聘流程补齐并核验', '确认到岗时间与调剂意向']
    }
  },
  {
    id: 'demo-2',
    fileName: '王强-简历.pdf',
    parsedAt: '2026-09-01 09:40',
    basic: {
      name: '王强', gender: '男', birthDate: '1999-03-04', highestDegree: '本科', graduationDate: '2027-06-30',
      workYears: '0年', employmentStatus: '在校学生', maritalStatus: '未婚', height: 175, weight: 90,
      overseasEducation: false, country: '中国', householdType: '农业户口', householdLocation: '安徽合肥',
      hometown: '安徽合肥', hukouLocation: '安徽合肥', ethnicity: '汉族', politicalStatus: '中共党员', formalWorkExperience: '无'
    },
    contact: { phone: '13907654321', email: 'wangqiang@example.com', postcode: '230000', address: '合肥市蜀山区长江西路200号' },
    certificate: { nationality: '中国', idType: '居民身份证', idNumber: '340103199903040033' },
    intention: { currentCity: '合肥', targetCities: ['上海'], onboardTime: '2027-07', expectSalary: '12k-15k' },
    agreeAdjust: true,
    educationList: [
      { period: '2021.09 - 2027.06', start: '2021-09', end: '2027-06', school: '华东联合大学', major: '计算机科学与技术', level: '本科', location: '上海', studyMode: '全日制', rank: '', gpa: '3.1', gpaFull: '4.0', retake: '无', isFullTime: '是' }
    ],
    workList: [
      { period: '2025.06 - 2025.09', start: '2025-06', end: '2025-09', company: '合肥某软件公司', position: '开发实习生', department: '研发部', description: '参与公司内部管理系统的软件开发，使用 Python 完成数据导入与报表模块', achievement: '报表生成耗时缩短 40%', reason: '实习期满返校' }
    ],
    projectList: [
      { period: '2024.09 - 2025.01', start: '2024-09', end: '2025-01', name: '校园二手交易平台', description: '面向校园的二手物品交易与信用互评平台', duty: '后端开发，负责订单与消息模块' }
    ],
    practiceList: [],
    campusList: ['2022.09 - 2023.06 班级学习委员'],
    trainingList: [],
    skillList: [
      { name: 'Python', level: '熟练', years: '2年' },
      { name: 'MySQL', level: '掌握', years: '1年' }
    ],
    certificateList: [],
    languageList: [
      { language: '英语', level: '一般', certificate: '' }
    ],
    awardList: [],
    family: {
      father: {},
      mother: { relation: '母亲', name: '刘芳', company: '个体经营', position: '店主', birthDate: '1974-08-20' }
    },
    companyRelatives: { hasRelatives: false, needAvoidance: false },
    photos: [{ name: '生活照.jpg', url: photoUri('#c3a56f', '生活照') }],
    attachments: [],
    selfEvaluation: '踏实肯干，热爱编程，希望在软件开发岗位上长期发展。',
    interests: '篮球、摄影',
    extraQuestions: { majorViolation: '无', business: '无', majorIllness: '无' },
    summary: {
      overview: '王强，男，1999 年生，华东联合大学计算机科学与技术本科，预计 2027 年 6 月毕业（晚于 2026 届要求），未婚。',
      internships: '一段软件开发实习（合肥某软件公司，Python 报表模块）与一个校园二手交易平台课程项目。',
      skills: 'Python（熟练）、MySQL（掌握）。',
      risks: ['最高学历为本科，非硕士/博士（规则1）', '毕业时间 2027-06 不符合国内 2026-01~2026-07 要求（规则2）', '意向城市为上海，非南京及下辖区县（规则6）', '院校「华东联合大学」不在 2026 届院校名录内（规则10）', 'BMI 29.4 超出正常范围 18~24（规则11）', '家庭信息父亲完全未填写（规则8）', '英语无证书需人工核验（规则4）', '缺少硕士学历记录无法核验学历衔接（规则5）']
    },
    interview: {
      directions: ['软件开发（Python 方向）'],
      questionGroups: [
        { category: '基础能力', questions: ['Python 报表模块如何设计？数据量大时如何优化？', '校园二手平台订单模块的状态机如何设计？'] },
        { category: '岗位匹配', questions: ['毕业时间为 2027 年 6 月，与 2026 届招聘计划不符，如何考虑？', '意向城市为上海，是否接受南京工作？'] }
      ],
      concerns: ['学历与毕业时间均不符合硬性要求，建议谨慎评估', '毕业院校不在名录内、家庭信息不完整，需人事复核', 'BMI 偏高，如岗位有体检标准需提前告知']
    }
  },
  {
    id: 'demo-3',
    fileName: '李慧-简历.pdf',
    parsedAt: '2026-08-31 16:05',
    basic: {
      name: '李慧', gender: '女', birthDate: '1999-05-12', highestDegree: '硕士', graduationDate: '2026-06-30',
      workYears: '0年', employmentStatus: '应届毕业生', maritalStatus: '未婚', height: 162, weight: 52,
      overseasEducation: false, country: '中国', householdType: '城镇户口', householdLocation: '江苏南京',
      hometown: '江苏南京', hukouLocation: '江苏南京', ethnicity: '汉族', politicalStatus: '中共党员', formalWorkExperience: '无'
    },
    contact: { phone: '13702468013', email: 'lihui@example.com', postcode: '210000', address: '南京市鼓楼区汉口路22号' },
    certificate: { nationality: '中国', idType: '居民身份证', idNumber: '320106199905120044' },
    intention: { currentCity: '南京', targetCities: ['南京市'], onboardTime: '2026-07', expectSalary: '14k-18k' },
    agreeAdjust: true,
    educationList: [
      { period: '2024.09 - 2026.06', start: '2024-09', end: '2026-06', school: '南京大学', major: '软件工程', level: '硕士', location: '南京', studyMode: '全日制', rank: '前5%', gpa: '3.8', gpaFull: '4.0', retake: '无', isFullTime: '是' },
      { period: '2020.09 - 2024.06', start: '2020-09', end: '2024-06', school: '南京大学', major: '软件工程', level: '本科', location: '南京', studyMode: '全日制', rank: '前8%', gpa: '3.6', gpaFull: '4.0', retake: '无', isFullTime: '是' }
    ],
    workList: [
      { period: '2025.06 - 2025.11', start: '2025-06', end: '2025-11', company: '某互联网大厂', position: 'AI 研发实习生', department: '智能平台部', description: '参与 AI 问答系统的算法研发与大模型评测', achievement: '搭建自动化评测流水线，覆盖 800+ 测试用例', reason: '实习期满返校' }
    ],
    projectList: [
      { period: '2025.01 - 2025-05', start: '2025-01', end: '2025-05', name: '智能简历解析工具', description: '基于大模型的结构化简历解析与字段抽取工具', duty: '负责提示词工程与抽取准确率优化' }
    ],
    practiceList: ['2023.07 南京某社区「银发数字课堂」志愿讲师，帮助老人学习智能手机使用'],
    campusList: ['2021.09 - 2022.06 校围棋社社长'],
    trainingList: ['2025.03 - 2025.04 大模型提示词工程专项训练营'],
    skillList: [
      { name: '大模型应用', level: '熟练', years: '2年' },
      { name: 'Python', level: '精通', years: '4年' },
      { name: 'Java', level: '掌握', years: '2年' }
    ],
    certificateList: [
      { name: 'PMP 项目管理认证', date: '2025-06', org: '项目管理协会（PMI）' }
    ],
    languageList: [
      { language: '英语', level: '熟练', certificate: '雅思7.0' }
    ],
    awardList: [
      { name: '国家奖学金', date: '2023-10', org: '教育部', referee: '陈教授', level: '国家级' }
    ],
    family: {
      father: { relation: '父亲', name: '李建国', company: '南京某制造企业', position: '工程师', birthDate: '1971-02-15' },
      mother: { relation: '母亲', name: '周敏', company: '南京某医院', position: '护士长', birthDate: '1973-11-08' }
    },
    companyRelatives: { hasRelatives: false, needAvoidance: false },
    photos: [{ name: '生活照.jpg', url: photoUri('#9a8fb8', '生活照') }],
    attachments: [{ name: '学位证书.pdf', size: 256000, url: '#' }],
    selfEvaluation: '南京大学软件工程硕士，专注大模型应用研发，具备完整的算法与工程能力，政治面貌中共党员，家庭均在南京，稳定性好。',
    interests: '围棋（业余 4 段）、羽毛球、科普志愿服务',
    extraQuestions: { majorViolation: '无', business: '无', majorIllness: '无' },
    summary: {
      overview: '李慧，女，1999 年生，南京大学软件工程硕士（2026 届），本硕均就读南京大学（国内985，院校名录内），中共党员，家庭信息完整，南京本地。',
      internships: '一段 AI 研发实习（某互联网大厂智能平台部，大模型评测）；代表项目：智能简历解析工具（提示词工程与抽取优化）。',
      skills: '大模型应用（熟练）、Python（精通）、Java（掌握）；雅思 7.0；持有 PMP 认证。',
      risks: []
    },
    interview: {
      directions: ['大模型应用研发', 'AI 评测/算法工程'],
      questionGroups: [
        { category: '项目深挖', questions: ['智能简历解析工具的抽取准确率如何定义与提升？', '评测流水线如何设计才能覆盖长尾 case？'] },
        { category: '综合素质', questions: ['作为围棋社社长，如何组织活动并平衡学业？', '党员身份对你意味着什么？'] }
      ],
      concerns: []
    }
  }
]
