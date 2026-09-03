// 21 模块元数据：驱动左侧导航与中栏渲染
export const MODULES = [
  { no: 1, key: 'basic', title: '基本信息', type: 'kv', fields: [
    ['name', '姓名'], ['gender', '性别'], ['birthDate', '出生日期'],
    ['highestDegree', '最高学历'], ['graduationDate', '毕业时间'], ['workYears', '工作年限'],
    ['employmentStatus', '在职状态'], ['maritalStatus', '婚姻状态'], ['height', '身高(cm)'],
    ['weight', '体重(kg)'], ['overseasEducation', '海外教育经历'], ['country', '国家/地区'],
    ['householdType', '入学前户口性质'], ['householdLocation', '入学前户口所在地'], ['hometown', '籍贯'],
    ['hukouLocation', '户口所在地'], ['ethnicity', '民族'], ['politicalStatus', '政治面貌'],
    ['formalWorkExperience', '正式工作经历']
  ]},
  { no: 2, key: 'contact', title: '联系信息', type: 'kv', fields: [
    ['phone', '手机号'], ['email', '邮箱'], ['postcode', '邮编'], ['address', '居住地址']
  ]},
  { no: 3, key: 'certificate', title: '证件信息', type: 'kv-id', fields: [
    ['nationality', '国籍'], ['idType', '证件类型'], ['idNumber', '证件号码']
  ]},
  { no: 4, key: 'intention', title: '求职意向', type: 'kv', fields: [
    ['currentCity', '现居地'], ['targetCities', '意向城市'], ['onboardTime', '到岗时间'], ['expectSalary', '期望薪资']
  ]},
  { no: 5, key: 'educationList', title: '教育经历', type: 'list', fields: [
    ['period', '时间段'], ['school', '院校'], ['major', '专业'], ['location', '院校所在地'],
    ['studyMode', '学习形式'], ['rank', '成绩排名'], ['gpa', '绩点'], ['gpaFull', '满分绩点'],
    ['retake', '重修/补考'], ['isFullTime', '是否全日制']
  ]},
  { no: 6, key: 'workList', title: '工作经历', type: 'list', fields: [
    ['period', '时间段'], ['company', '公司名称'], ['position', '职位'], ['department', '部门'],
    ['description', '工作描述'], ['achievement', '工作业绩'], ['reason', '离职原因']
  ]},
  { no: 7, key: 'projectList', title: '项目经历', type: 'list', fields: [
    ['period', '时间段'], ['name', '项目名称'], ['description', '项目描述'], ['duty', '职责描述']
  ]},
  { no: 8, key: 'practiceList', title: '实践经历', type: 'textlist' },
  { no: 9, key: 'campusList', title: '校园活动', type: 'textlist' },
  { no: 10, key: 'trainingList', title: '培训经历', type: 'textlist' },
  { no: 11, key: 'skillList', title: '专业技能', type: 'list', fields: [
    ['name', '技能名称'], ['level', '掌握程度'], ['years', '使用时长']
  ]},
  { no: 12, key: 'certificateList', title: '资格证书', type: 'list', fields: [
    ['name', '证书名称'], ['date', '获得时间'], ['org', '授予机构']
  ]},
  { no: 13, key: 'languageList', title: '语言技能', type: 'list', fields: [
    ['language', '语种'], ['level', '掌握程度'], ['certificate', '获得证书']
  ]},
  { no: 14, key: 'awardList', title: '获奖信息', type: 'list', fields: [
    ['name', '获奖名称'], ['date', '获得时间'], ['org', '授予单位'], ['referee', '证明人'], ['level', '奖项级别']
  ]},
  { no: 15, key: 'family', title: '家庭信息', type: 'family' },
  { no: 16, key: 'companyRelatives', title: '我司亲属', type: 'kv', fields: [
    ['hasRelatives', '是否有我司亲属'], ['needAvoidance', '是否涉及亲属回避']
  ]},
  { no: 17, key: 'photos', title: '生活照', type: 'photos' },
  { no: 18, key: 'selfEvaluation', title: '自我评价', type: 'longtext' },
  { no: 19, key: 'interests', title: '特长兴趣', type: 'longtext' },
  { no: 20, key: 'attachments', title: '附件', type: 'photos' },
  { no: 21, key: 'extraQuestions', title: '附加问题', type: 'kv', fields: [
    ['majorViolation', '重大违法违规违纪或涉黑涉恶'], ['business', '个人经商办企业'], ['majorIllness', '重大疾病或家族遗传病史']
  ]}
]
