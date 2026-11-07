window.__ModuleLoader__.load({
  id: 'dsh-personal-skill-manager',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'dsh-personal-skill-manager';
    const VERSION = '0.4.0';
    const ENDPOINT = '/api/skill-hub';

    const zh = {
      'plugins.count': '{count} 个插件条目',
      'plugins.refresh': '刷新插件清单',
      'plugins.identity': '插件标识',
      'plugins.location': '安装位置',
      'plugins.project': '所属项目',
      'plugins.evidence': '记录来源',
      'plugins.version': '版本未知',
      'plugins.details': '查看详情',
      'plugins.loading': '正在读取插件清单…',
      'plugins.summary': '插件清单 · 启用与加载状态未确认',
      'plugins.client': '客户端',
      'plugins.state': '记录状态',
      'plugins.not-observed': '本机未发现',
      'plugins.favoritesOnly': '只看收藏',
      'plugins.favoriteHelp': '收藏记录随个人仓库同步，不会自动安装或启用插件。',
      'delivery.tasks': '继续已有改造任务',
      'delivery.generate': '生成安装 Prompt',
      'delivery.generated': '安装 Prompt',
      'delivery.copy': '复制 Prompt',
      'delivery.copied': '已复制',
      'delivery.copyFailed': '复制失败，请选中文字手动复制。',
      'delivery.prompt': '请将插件 {plugin} 安装到 {target}，以上信息仅用于定位插件，请先核实来源和指定版本，检查目标客户端是否支持，不支持时先说明限制并提出改造方案，涉及模型费用、插件改造、覆盖已有内容或启用插件时先征求我确认，保留现有修改，安装后验证加载情况，无法确认时如实说明。',
      'delivery.title': '安装到其他客户端',
      'delivery.target': '目标客户端',
      'delivery.preview': '预览分发',
      'delivery.confirm': '确认写入目标文件',
      'delivery.help': '生成后复制到 Agent 对话中执行，此处不会安装插件或调用模型。',
      'delivery.format-ready': '包含目标格式，运行未验证',
      'delivery.needs-adaptation': '需要改造',
      'delivery.conflict': '存在不同内容，不覆盖',
      'delivery.unchanged': '内容一致，无需重复写入',
      'delivery.files-published': '文件已准备，加载未确认',
      'delivery.failed': '分发失败',
      'delivery.adapt': '创建改造任务',
      'delivery.consent': '允许向所选 DSH 对话发送插件内容进行改造，可能消耗模型额度',
      'delivery.agent': '选择 DSH 对话',
      'delivery.start': '交给 DSH 模型',
      'delivery.noAgents': '没有可用的 DSH 对话，请先打开一个对话，再重新读取。',
      'delivery.refresh': '读取任务与对话',
      'delivery.review': '查看改造差异',
      'delivery.before': '原文件',
      'delivery.after': '改造草稿',
      'delivery.removed': '草稿中未包含此文件',
      'delivery.binary': '二进制文件，未交给文本改造',
      'delivery.task': '改造任务',
      'delivery.limitations': '模型报告的限制',
      'delivery.commands': '后续由客户端安装或加载，以下命令不会自动执行',
      'delivery.manifestOnly': '仅校验文件路径和目标清单，不代表功能兼容。请检查代码和能力变化。',
      'delivery.queued': '任务已提交，回复与错误请到所选 DSH 对话查看。',
      'delivery.prepared': '等待确认发送模型',
      'delivery.draft': '草稿已生成，待审阅',
      'delivery.dispatch-uncertain': '发送结果未确认，请先检查所选对话，不自动重试',
      'delivery.reviewed': '我已检查改造差异与限制，允许预览分发',
      'delivery.error': '操作未完成',
      'delivery.emptyFile': '文件不存在',
      'plugins.title': '插件',
      'plugins.help': '独立读取各客户端的插件记录。缓存和本地目录不代表已安装，启用与加载状态未确认。',
      'plugins.empty': '未发现插件记录或清单。未发现不代表没有安装。',
      'plugins.recorded': '有安装记录',
      'plugins.cache-only': '仅发现缓存',
      'plugins.local-directory': '发现本地目录',
      'plugins.missing': '安装文件缺失',
      'plugins.unknown': '启用 / 加载未确认',
      'plugins.warnings': '部分记录不可读或格式未支持',
      'panel.title': '我的技能',
      'panel.subtitle': '跨端统一管理和同步个人技能',
      'panel.allClients': '全部客户端',
      'panel.clientFilter': '按客户端筛选',
      'panel.clientSkills': '客户端技能',
      'stats.total': '全部技能',
      'stats.library': '我的技能',
      'stats.written': '我编写的',
      'stats.collected': '收藏的',
      'stats.clients': '客户端专有',
      'stats.conflicts': '待处理冲突',
      'notice.savedAsMine': '「{name}」已转为我的技能。',
      'notice.distributed': '已分发到客户端。',
      'detail.saveAsMine': '另存为我的技能',
      'detail.distributeTo': '分发到此客户端',
      'detail.replaceHere': '备份并替换',
      'panel.refresh': '刷新',
      'panel.create': '新建技能',
      'panel.sync': '同步',
      'sync.title': '同步与换机恢复',
      'sync.help': '',
      'sync.personalDir': '个人库目录',
      'sync.personalDirHint': '',
      'sync.gitRemote': 'Git 远端',
      'sync.gitRemoteHint': '例如 git@github.com:you/skills.git；不要把令牌写进 URL。',
      'sync.branch': '分支',
      'sync.autoDistribute': '启动时自动分发到客户端',
      'sync.autoSync': '编辑后自动同步（暂不自动推送）',
      'sync.save': '保存设置',
      'sync.saveRestore': '保存并恢复',
      'sync.syncNow': '同步个人库',
      'sync.restore': '从 Git 恢复',
      'sync.install': '安装收藏',
      'sync.back': '返回技能',
      'sync.repo': '个人库仓库',
      'sync.repoYes': '已是 Git 仓库',
      'sync.repoNo': '尚未初始化',
      'sync.repoDirty': '有未提交改动',
      'sync.repoClean': '工作区干净',
      'sync.remote': '远端',
      'sync.none': '未配置',
      'sync.manifest': '个人库',
      'sync.favorites': '技能',
      'sync.installable': '可同步',
      'sync.lastRestore': '上次安装',
      'sync.never': '还没有运行过',
      'sync.warning': '提醒',
      'sync.loading': '正在读取同步状态…',
      'sync.loadFailed': '读取同步状态失败：{error}',
      'sync.saved': '设置已保存。',
      'sync.synced': '个人库同步完成。',
      'sync.restored': '已从 Git 恢复并安装收藏。',
      'sync.installedDone': '收藏安装完成。',
      'sync.actionFailed': '操作失败：{error}',
      'sync.resultInstalled': '新安装 {count}',
      'sync.resultPresent': '已存在 {count}',
      'sync.resultFailed': '失败 {count}',
      'sync.resultNeedsSource': '缺少来源 {count}',
      'sync.noFavorites': '还没有我编写的技能。',
      'sync.resultsTitle': '逐项结果',
      'sync.loadingAction': '处理中…',
      'sync.changed': '本地变更',
      'sync.commit': '提交',
      'sync.pushed': '已推送',
      'sync.reason': '说明',
      'sync.sourcePersonal': '个人库',
      'sync.sourceGit': 'Git 来源',
      'sync.sourceUnknown': '来源未知',
      'sync.installableYes': '可安装',
      'sync.legacyTitle': '旧收藏副本',
      'sync.legacyHelp': '清理后副本进入插件备份，来源记录保留。',
      'sync.cleanupLegacy': '清理旧收藏副本',
      'sync.legacyCleaned': '旧收藏副本已移入备份。',
      'sync.catalog': '换机目录',
      'sync.catalogHelp': '按记录的版本安装到已启用的客户端。',
      'sync.installCatalog': '安装收藏',
      'sync.catalogInstalled': '换机目录安装完成。',
      'sync.distribute': '分发到客户端',
      'sync.distributeReplace': '备份并替换冲突',
      'sync.distributed': '已分发到客户端。',
      'sync.collected': '已收集「{name}」到个人库。',
      'sync.targets': '客户端目标',
      'sync.targetsHelp': '已有不同内容时保留，不覆盖。',
      'sync.targetOnly': '客户端里尚未归入我的技能',
      'sync.targetOnlyHelp': '',
      'sync.collect': '收藏来源',
      'sync.modeLink': '链接',
      'sync.modeCopy': '复制',
      'sync.enabled': '启用',
      'sync.disabled': '未启用',
      'sync.linked': '链接',
      'sync.copied': '复制',
      'sync.present': '已一致',
      'sync.conflict': '已有不同内容',
      'sync.failed': '失败',
      'sync.state.source': '来源',
      'sync.state.linked': '已链接',
      'sync.state.copied': '已复制',
      'sync.state.present': '内容一致',
      'sync.state.missing': '未安装',
      'sync.state.conflict': '已有不同内容',
      'sync.state.failed': '失败',
      'sync.kindPersonal': '自写',
      'sync.kindCollected': '收藏',
      'sync.missing': '缺失',
      'detail.targets': '客户端分发状态',
      'detail.targetsHelp': '已有不同内容时默认保留。要统一时点「备份并替换」。',
      'detail.clients': '来源客户端',
      'detail.collectedFrom': '来自 {client}',
      'detail.collect': '收藏来源',
      'detail.favorite': '收藏',
      'detail.unfavorite': '取消收藏',
      'detail.alreadyInLibrary': '已在个人技能库',
      'detail.clientNote': '',
      'detail.legacyCollectedNote': '这是早期复制进个人库的副本。',
      'kind.personal': '我编写的',
      'kind.collected': '收藏的',
      'kind.client': '未收藏',
      'client.shared': '共享',
      'client.more': '+{count}',
      'source.library': 'skills/',
      'notice.collected': '已收藏「{name}」。',
      'sync.state.client': '客户端',
      'badge.targetConflict': '待处理 {count} 个客户端',
      'sync.installableNo': '不可安装',
      'sync.settingsHint': '目录需要在 DSH 的扫描范围内，否则同步后也不会加载。',
      'sync.firstSyncHint': '还不是仓库时，只在远端分支为空时初始化并推送。远端已有分支则拒绝覆盖。',
      'panel.count': '{count} 个技能',
      'panel.searchPlaceholder': '搜索名称、描述或路径',
      'panel.allGroups': '全部来源',
      'panel.groupFilter': '来源筛选',
      'panel.favoritesOnly': '只看收藏',
      'panel.allSkills': '全部技能',
      'panel.mySkills': '我的技能',
      'panel.writtenSkills': '我编写的',
      'panel.collectedSkills': '收藏的',
      'panel.filter': '筛选技能',
      'panel.favoriteAdd': '收藏',
      'panel.favoriteRemove': '取消收藏',
      'panel.incomplete': '部分目录读取失败，列表可能不完整。',
      'group.personal': '个人技能库',
      'group.project-dsh': '项目技能（.dsh/skills）',
      'group.project-agents': '项目技能（.agents/skills）',
      'group.custom': '自定义目录',
      'group.shared': '共享 Agent 技能',
      'group.bundled': '随附技能',
      'group.runtime': '运行时技能',
      'group.other': '其他来源',
      'groupHint.personal': '~/.dsh/skills',
      'groupHint.project-dsh': '仅当前项目',
      'groupHint.project-agents': '仅当前项目',
      'groupHint.custom': '配置的额外目录',
      'groupHint.shared': '~/.agents/skills',
      'groupHint.bundled': 'DSH 与插件随附，只读',
      'groupHint.runtime': '插件代码内嵌注册，只读',
      'groupHint.other': '来源未知',
      'badge.model': '模型可用',
      'badge.modelOff': '模型禁用',
      'badge.user': '用户可用',
      'badge.userOff': '用户禁用',
      'badge.linked': '软链接',
      'badge.duplicate': '同名 {count} 处',
      'badge.shadowed': '被同名覆盖',
      'badge.sameName': '同名另有 {count} 处',
      'badge.readonly': '只读',
      'list.loading': '正在读取技能目录…',
      'list.empty': '没有找到技能。',
      'list.loadFailed': '加载失败：{error}',
      'list.retry': '重试',
      'detail.select': '从左侧选择一个技能查看详情。',
      'detail.path': '文件',
      'detail.source': '来源',
      'detail.whenToUse': '适用场景',
      'detail.editor': 'SKILL.md 内容',
      'detail.files': '支持文件（{count}）',
      'detail.digest': '内容摘要',
      'detail.noDescription': '暂无描述',
      'detail.readonlyNote': '此技能来自只读来源，不能在这里修改。',
      'detail.editNote': '保存会改写 SKILL.md。',
      'detail.dirty': '有未保存修改',
      'detail.clean': '与磁盘内容一致',
      'detail.noFiles': '没有支持文件。',
      'detail.modelToggle': '允许模型调用',
      'detail.userToggle': '允许用户调用',
      'detail.modelHint': '写入 disable-model-invocation',
      'detail.userHint': '写入 user-invocable',
      'detail.save': '保存',
      'detail.reset': '还原',
      'detail.saveAsPersonal': '另存为我的技能',
      'detail.delete': '移入回收站',
      'detail.copyPath': '复制路径',
      'detail.copied': '已复制',
      'detail.favoriteInstallable': '已收藏',
      'detail.favoriteNotInstallable': '已收藏',
      'detail.linkedNote': '这是软链接，修改请直接编辑目标文件。',
      'detail.editModel': '模型',
      'detail.editUser': '用户',
      'create.title': '新建技能',
      'create.back': '返回列表',
      'create.root': '创建位置',
      'create.rootPersonal': '我编写的技能',
      'create.rootProject': '项目技能（当前项目 .dsh/skills）',
      'create.name': '技能名',
      'create.nameHint': 'kebab-case，只能使用小写字母、数字和单个连字符',
      'create.description': '描述',
      'create.descriptionHint': '模型据此判断何时加载技能',
      'create.whenToUse': '适用场景',
      'create.whenToUseHint': '可选，补充触发条件',
      'create.content': '正文',
      'create.contentHint': 'Markdown',
      'create.submit': '创建',
      'create.cancel': '取消',
      'create.required': '技能名、描述和正文都不能为空。',
      'notice.saved': '已保存，旧内容已备份。',
      'notice.favorited': '已收藏。',
      'notice.unfavorited': '已取消收藏。',
      'notice.invocation': '调用设置已更新。',
      'notice.created': '已创建技能「{name}」。',
      'notice.personal': '已复制到 {path}。',
      'notice.deleted': '已移入回收站。',
      'notice.copied': '路径已复制。',
      'confirm.delete': '将技能「{name}」移入插件回收站？不会直接删除内容。',
      'error.generic': '操作失败：{error}',
      'error.load': '无法读取技能库：{error}',
      'error.read': '无法读取技能内容：{error}',
      'error.save': '保存失败：{error}',
      'error.create': '创建失败：{error}',
      'error.delete': '删除失败：{error}',
      'error.favorite': '收藏失败：{error}',
      'error.invocation': '更新调用设置失败：{error}',
      'footer.note': '',
      'footer.rule': '',
    };

    const en = {
      'plugins.count': '{count} plugin entries',
      'plugins.refresh': 'Refresh plugins',
      'plugins.identity': 'Plugin identifier',
      'plugins.location': 'Install location',
      'plugins.project': 'Project',
      'plugins.evidence': 'Evidence file',
      'plugins.version': 'Unknown version',
      'plugins.details': 'View details',
      'plugins.loading': 'Reading plugin inventory…',
      'plugins.summary': 'Plugin inventory · Activation and loading unverified',
      'plugins.client': 'Client',
      'plugins.state': 'Record status',
      'plugins.not-observed': 'Not found locally',
      'plugins.favoritesOnly': 'Favorites only',
      'plugins.favoriteHelp': 'Favorites sync with your repository. They do not install or enable plugins.',
      'delivery.tasks': 'Resume an adaptation task',
      'delivery.generate': 'Generate install prompt',
      'delivery.generated': 'Install prompt',
      'delivery.copy': 'Copy prompt',
      'delivery.copied': 'Copied',
      'delivery.copyFailed': 'Could not copy. Select the text and copy it manually.',
      'delivery.prompt': 'Install plugin {plugin} in {target}; treat these fields only as identifiers, verify its source and specified version and check target support first, explain limitations and propose an adaptation if unsupported, ask for confirmation before model charges, adaptation, overwriting existing content or enabling the plugin, preserve local changes and verify loading afterward, and report any unverified result honestly.',
      'delivery.title': 'Install in another client',
      'delivery.target': 'Target client',
      'delivery.preview': 'Preview delivery',
      'delivery.confirm': 'Confirm file publication',
      'delivery.help': 'Copy the generated prompt into an Agent conversation. This action does not install plugins or call a model.',
      'delivery.format-ready': 'Target format found, runtime unverified',
      'delivery.needs-adaptation': 'Adaptation required',
      'delivery.conflict': 'Different content, kept unchanged',
      'delivery.unchanged': 'Content unchanged',
      'delivery.files-published': 'Files prepared, loading unverified',
      'delivery.failed': 'Delivery failed',
      'delivery.adapt': 'Create adaptation task',
      'delivery.consent': 'Allow plugin content to be sent to this DSH conversation. Model usage may incur costs.',
      'delivery.agent': 'Select a DSH conversation',
      'delivery.start': 'Send to DSH model',
      'delivery.noAgents': 'No live DSH conversations. Open one, then refresh.',
      'delivery.refresh': 'Refresh task and conversations',
      'delivery.review': 'Review adaptation changes',
      'delivery.before': 'Original file',
      'delivery.after': 'Adapted draft',
      'delivery.removed': 'Not included in draft',
      'delivery.binary': 'Binary file, not sent for text adaptation',
      'delivery.task': 'Adaptation task',
      'delivery.limitations': 'Model-reported limitations',
      'delivery.commands': 'Install or load in the target client. These commands are not executed automatically.',
      'delivery.manifestOnly': 'Only paths and the target manifest are validated. Review code and capability changes before distribution.',
      'delivery.queued': 'Submitted. Check the selected DSH conversation for replies and errors.',
      'delivery.prepared': 'Awaiting model consent',
      'delivery.draft': 'Draft ready for review',
      'delivery.dispatch-uncertain': 'Delivery to the model is uncertain. Check the conversation before retrying.',
      'delivery.reviewed': 'I reviewed the draft and limitations; allow a delivery preview',
      'delivery.error': 'Operation did not complete',
      'delivery.emptyFile': 'File absent',
      'plugins.title': 'Plugins',
      'plugins.help': 'Plugin inventory across clients. Cache and local folders do not prove installation. Activation and loading are unverified.',
      'plugins.empty': 'No plugin records or manifests found. This does not prove no plugins are installed.',
      'plugins.recorded': 'Installation recorded',
      'plugins.cache-only': 'Cache only',
      'plugins.local-directory': 'Local directory found',
      'plugins.missing': 'Installed files missing',
      'plugins.unknown': 'Activation / loading unverified',
      'plugins.warnings': 'Some records are unreadable or unsupported',
      'panel.title': 'My skills',
      'panel.subtitle': 'Manage and sync personal skills across clients',
      'panel.allClients': 'All clients',
      'panel.clientFilter': 'Filter by client',
      'panel.clientSkills': 'Client skills',
      'stats.total': 'All skills',
      'stats.library': 'My skills',
      'stats.written': 'Written',
      'stats.collected': 'Collected',
      'stats.clients': 'Client-only',
      'stats.conflicts': 'Pending conflicts',
      'notice.savedAsMine': '“{name}” is now a written skill.',
      'notice.distributed': 'Distributed to the client.',
      'detail.saveAsMine': 'Save as my skill',
      'detail.distributeTo': 'Distribute here',
      'detail.replaceHere': 'Back up and replace',
      'panel.refresh': 'Refresh',
      'panel.create': 'New skill',
      'panel.sync': 'Sync',
      'sync.title': 'Sync and restore',
      'sync.help': '',
      'sync.personalDir': 'Personal directory',
      'sync.personalDirHint': '',
      'sync.gitRemote': 'Git remote',
      'sync.gitRemoteHint': 'For example git@github.com:you/skills.git; do not put tokens in the URL.',
      'sync.branch': 'Branch',
      'sync.autoDistribute': 'Distribute to clients on startup',
      'sync.autoSync': 'Sync after edits (does not push automatically)',
      'sync.save': 'Save settings',
      'sync.saveRestore': 'Save and restore',
      'sync.syncNow': 'Sync personal library',
      'sync.restore': 'Restore from Git',
      'sync.install': 'Install favorites',
      'sync.back': 'Back to skills',
      'sync.repo': 'Personal repository',
      'sync.repoYes': 'Git repository',
      'sync.repoNo': 'Not initialized',
      'sync.repoDirty': 'Uncommitted changes',
      'sync.repoClean': 'Working tree clean',
      'sync.remote': 'Remote',
      'sync.none': 'Not configured',
      'sync.manifest': 'Personal library',
      'sync.favorites': 'skills',
      'sync.installable': 'present',
      'sync.lastRestore': 'Last install',
      'sync.never': 'Not run yet',
      'sync.warning': 'Notice',
      'sync.loading': 'Reading sync status…',
      'sync.loadFailed': 'Could not read sync status: {error}',
      'sync.saved': 'Settings saved.',
      'sync.synced': 'Personal library synced.',
      'sync.restored': 'Restored from Git and installed favorites.',
      'sync.installedDone': 'Favorite installation finished.',
      'sync.actionFailed': 'Operation failed: {error}',
      'sync.resultInstalled': '{count} newly installed',
      'sync.resultPresent': '{count} already present',
      'sync.resultFailed': '{count} failed',
      'sync.resultNeedsSource': '{count} missing source',
      'sync.noFavorites': 'No written skills yet.',
      'sync.resultsTitle': 'Per-item results',
      'sync.loadingAction': 'Working…',
      'sync.changed': 'Local change',
      'sync.commit': 'Commit',
      'sync.pushed': 'Pushed',
      'sync.reason': 'Reason',
      'sync.sourcePersonal': 'Personal library',
      'sync.sourceGit': 'Git source',
      'sync.sourceUnknown': 'Unknown source',
      'sync.installableYes': 'Installable',
      'sync.legacyTitle': 'Legacy favorite copies',
      'sync.legacyHelp': 'Cleanup moves the copies into plugin backups and keeps the source records.',
      'sync.cleanupLegacy': 'Clean up legacy copies',
      'sync.legacyCleaned': 'Legacy favorite copies moved to backups.',
      'sync.catalog': 'Reinstall catalog',
      'sync.catalogHelp': 'Install the recorded revision into enabled clients.',
      'sync.installCatalog': 'Install favorites',
      'sync.catalogInstalled': 'Catalog installation finished.',
      'sync.distribute': 'Distribute to clients',
      'sync.distributeReplace': 'Back up and replace conflicts',
      'sync.distributed': 'Distributed to clients.',
      'sync.collected': 'Collected “{name}” into the personal library.',
      'sync.targets': 'Client targets',
      'sync.targetsHelp': 'Different existing content is kept.',
      'sync.targetOnly': 'Not yet in my skills',
      'sync.targetOnlyHelp': '',
      'sync.collect': 'Favorite source',
      'sync.modeLink': 'link',
      'sync.modeCopy': 'copy',
      'sync.enabled': 'enabled',
      'sync.disabled': 'disabled',
      'sync.linked': 'Linked',
      'sync.copied': 'Copied',
      'sync.present': 'Present',
      'sync.conflict': 'Different content',
      'sync.failed': 'Failed',
      'sync.state.source': 'Source',
      'sync.state.linked': 'Linked',
      'sync.state.copied': 'Copied',
      'sync.state.present': 'In sync',
      'sync.state.missing': 'Not installed',
      'sync.state.conflict': 'Different content',
      'sync.state.failed': 'Failed',
      'sync.kindPersonal': 'Written',
      'sync.kindCollected': 'Collected',
      'sync.missing': 'Missing',
      'detail.targets': 'Client distribution',
      'detail.targetsHelp': 'Different content is kept. Use “Back up and replace” to overwrite one client.',
      'detail.clients': 'Source clients',
      'detail.collectedFrom': 'From {client}',
      'detail.collect': 'Favorite source',
      'detail.favorite': 'Favorite',
      'detail.unfavorite': 'Remove favorite',
      'detail.alreadyInLibrary': 'Already in my skills',
      'detail.clientNote': '',
      'detail.legacyCollectedNote': 'This copy was written into the library by an earlier version.',
      'kind.personal': 'Written',
      'kind.collected': 'Collected',
      'kind.client': 'Not saved',
      'client.shared': 'Shared',
      'client.more': '+{count}',
      'source.library': 'skills/',
      'notice.collected': 'Favorited “{name}”.',
      'sync.state.client': 'Client',
      'badge.targetConflict': '{count} clients need review',
      'sync.installableNo': 'Not installable',
      'sync.settingsHint': 'The directory must be inside a DSH scan root, or synced files will not load.',
      'sync.firstSyncHint': 'If this is not a repository yet, it is initialized and pushed only when the remote branch is empty. An existing remote branch is refused.',
      'panel.count': '{count} skills',
      'panel.searchPlaceholder': 'Search name, description, or path',
      'panel.allGroups': 'All sources',
      'panel.groupFilter': 'Filter by source',
      'panel.favoritesOnly': 'Favorites only',
      'panel.allSkills': 'All skills',
      'panel.mySkills': 'My skills',
      'panel.writtenSkills': 'Written by me',
      'panel.collectedSkills': 'Collected',
      'panel.filter': 'Filter skills',
      'panel.favoriteAdd': 'Favorite',
      'panel.favoriteRemove': 'Remove from favorites',
      'panel.incomplete': 'Some directories could not be read; this list may be incomplete.',
      'group.personal': 'Personal library',
      'group.project-dsh': 'Project skills (.dsh/skills)',
      'group.project-agents': 'Project skills (.agents/skills)',
      'group.custom': 'Custom directories',
      'group.shared': 'Shared agent skills',
      'group.bundled': 'Bundled skills',
      'group.runtime': 'Runtime skills',
      'group.other': 'Other sources',
      'groupHint.personal': '~/.dsh/skills',
      'groupHint.project-dsh': 'This project only',
      'groupHint.project-agents': 'This project only',
      'groupHint.custom': 'Configured extra roots',
      'groupHint.shared': '~/.agents/skills',
      'groupHint.bundled': 'Shipped with DSH and plugins; read-only',
      'groupHint.runtime': 'Registered by plugin code; read-only',
      'groupHint.other': 'Unknown source',
      'badge.model': 'Model on',
      'badge.modelOff': 'Model off',
      'badge.user': 'User on',
      'badge.userOff': 'User off',
      'badge.linked': 'Link',
      'badge.duplicate': '{count} same-name entries',
      'badge.shadowed': 'Shadowed',
      'badge.sameName': '{count} more same-name entries elsewhere',
      'badge.readonly': 'Read-only',
      'list.loading': 'Reading skill directories…',
      'list.empty': 'No skills found.',
      'list.loadFailed': 'Could not load the library: {error}',
      'list.retry': 'Retry',
      'detail.select': 'Select a skill on the left to inspect it.',
      'detail.path': 'File',
      'detail.source': 'Source',
      'detail.whenToUse': 'When to use',
      'detail.editor': 'SKILL.md content',
      'detail.files': 'Supporting files ({count})',
      'detail.digest': 'Content digest',
      'detail.noDescription': 'No description',
      'detail.readonlyNote': 'This skill comes from a read-only source and cannot be edited here.',
      'detail.editNote': 'Saving rewrites SKILL.md.',
      'detail.dirty': 'Unsaved changes',
      'detail.clean': 'Matches the file on disk',
      'detail.noFiles': 'No supporting files.',
      'detail.modelToggle': 'Allow model invocation',
      'detail.userToggle': 'Allow user invocation',
      'detail.modelHint': 'Writes disable-model-invocation',
      'detail.userHint': 'Writes user-invocable',
      'detail.save': 'Save',
      'detail.reset': 'Reset',
      'detail.saveAsPersonal': 'Save as my skill',
      'detail.delete': 'Move to trash',
      'detail.copyPath': 'Copy path',
      'detail.copied': 'Copied',
      'detail.favoriteInstallable': 'Favorited',
      'detail.favoriteNotInstallable': 'Favorited',
      'detail.linkedNote': 'This skill is a link. Edit its target file directly.',
      'detail.editModel': 'Model',
      'detail.editUser': 'User',
      'create.title': 'New skill',
      'create.back': 'Back to list',
      'create.root': 'Location',
      'create.rootPersonal': 'A skill I write',
      'create.rootProject': 'Project skills (this project’s .dsh/skills)',
      'create.name': 'Name',
      'create.nameHint': 'kebab-case: lowercase letters, digits, and single hyphens',
      'create.description': 'Description',
      'create.descriptionHint': 'Used by the model to decide when to load the skill',
      'create.whenToUse': 'When to use',
      'create.whenToUseHint': 'Optional extra routing guidance',
      'create.content': 'Body',
      'create.contentHint': 'Markdown',
      'create.submit': 'Create',
      'create.cancel': 'Cancel',
      'create.required': 'Name, description, and body are required.',
      'notice.saved': 'Saved; the previous content was backed up.',
      'notice.favorited': 'Favorited.',
      'notice.unfavorited': 'Favorite removed.',
      'notice.invocation': 'Invocation settings updated.',
      'notice.created': 'Created skill “{name}”.',
      'notice.personal': 'Copied to {path}.',
      'notice.deleted': 'Moved to the trash.',
      'notice.copied': 'Path copied.',
      'confirm.delete': 'Move skill “{name}” to the plugin trash? Its content is preserved.',
      'error.generic': 'Operation failed: {error}',
      'error.load': 'Could not read the skill library: {error}',
      'error.read': 'Could not read skill content: {error}',
      'error.save': 'Save failed: {error}',
      'error.create': 'Create failed: {error}',
      'error.delete': 'Delete failed: {error}',
      'error.favorite': 'Favorite failed: {error}',
      'error.invocation': 'Invocation update failed: {error}',
      'footer.note': '',
      'footer.rule': '',
    };

    const css = [
      '.skh-plugin-item{position:relative;padding-right:30px}.skh-plugin-star{position:absolute;right:5px;top:15px;z-index:1}.skh-plugin-star[aria-pressed=true]{color:var(--dsw-alias-brand-primary)}.skh-plugin-star:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px}',
      '.skh-plugins{flex:1;min-width:0;overflow:auto;padding:20px 24px 32px}',
      '.skh-plugins-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}.skh-plugins-heading{display:flex;align-items:center;gap:10px}.skh-plugins h2{margin:0;font-size:16px;font-weight:600;letter-spacing:-.02em}.skh-plugins-head p{margin:5px 0 0;font-size:11px;color:var(--dsw-alias-label-secondary)}.skh-plugins-count{font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}.skh-plugins-head .skh-btn{padding:6px}',
      '.skh-plugin-columns,.skh-plugin-summary{display:grid;grid-template-columns:minmax(160px,1fr) 104px minmax(116px,auto) 14px;align-items:center;gap:16px}.skh-plugin-columns{padding:0 12px 8px;font-size:10px;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.skh-plugin-row{border-bottom:1px solid var(--dsw-alias-border-l1)}.skh-plugin-summary{list-style:none;padding:13px 12px;cursor:pointer;border-radius:5px;transition:background .12s}.skh-plugin-summary::-webkit-details-marker{display:none}.skh-plugin-summary:hover{background:var(--dsw-alias-bg-layer-2)}.skh-plugin-summary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.skh-plugin-name{display:flex;gap:10px;align-items:center;min-width:0}.skh-plugin-name .skh-mark{width:16px;height:16px;flex:none}.skh-plugin-label{min-width:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 9px}.skh-plugin-label strong{font-size:12px;font-weight:600;overflow-wrap:anywhere}.skh-plugin-version{font-size:10px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.skh-plugin-client{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.skh-plugin-states{display:flex;gap:5px;flex-wrap:wrap}.skh-plugin-state{border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:2px 6px;font-size:10px;line-height:1.5;color:var(--dsw-alias-label-secondary)}.skh-plugin-state.is-recorded{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}.skh-plugin-state.is-missing{border-style:dashed}.skh-plugin-chevron{font-size:19px;color:var(--dsw-alias-label-secondary);transition:transform .15s;text-align:center}.skh-plugin-row[open] .skh-plugin-chevron{transform:rotate(90deg)}',
      '.skh-plugin-expanded{padding:0 12px 16px 38px}.skh-plugin-description{font-size:12px;line-height:1.7;margin:0 0 12px;max-width:70ch}.skh-plugin-expanded dl{margin:0;display:grid;gap:9px}.skh-plugin-field{display:grid;grid-template-columns:80px minmax(0,1fr);gap:12px;font-size:11px}.skh-plugin-field dt{color:var(--dsw-alias-label-secondary)}.skh-plugin-field dd{margin:0;min-width:0}.skh-plugin-field code{font-family:ui-monospace,monospace;font-size:10px;line-height:1.7;overflow-wrap:anywhere;user-select:text}.skh-plugin-footnote{font-size:10px;color:var(--dsw-alias-label-secondary);margin-top:13px}.skh-plugin-empty{padding:40px 12px;color:var(--dsw-alias-label-secondary);font-size:12px}',
      '@media(max-width:640px){.skh-plugins{padding:16px 12px}.skh-plugin-columns{display:none}.skh-plugin-summary{grid-template-columns:minmax(0,1fr) auto 12px;gap:8px;padding:12px 6px}.skh-plugin-client{display:none}.skh-plugin-label{display:block}.skh-plugin-version{display:block;margin-top:2px}.skh-plugin-states{max-width:116px}.skh-plugin-expanded{padding-left:32px}.skh-plugin-field{grid-template-columns:1fr;gap:2px}.skh-plugins-head p{max-width:34ch}}',
      '@media(prefers-reduced-motion:reduce){.skh-plugin-summary,.skh-plugin-chevron{transition:none}}',
      '.skh-root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}',
      '.skh-root *{box-sizing:border-box}',
      '.skh-header{display:flex;align-items:flex-start;gap:12px;padding:14px 16px 8px;flex:none}',
      '.skh-heading{min-width:0}',
      '.skh-title{font-size:20px;font-weight:600;letter-spacing:-.02em}',
      '.skh-subtitle{margin-top:2px;font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.skh-header-actions{margin-left:auto;display:flex;gap:8px;flex:none}',
      '.skh-btn{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:6px;padding:5px 10px;font:inherit;font-size:12px;line-height:1.4;display:inline-flex;align-items:center;gap:6px;cursor:pointer}',
      '.skh-btn:hover:not(:disabled){border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2)}',
      '.skh-btn:disabled{opacity:.55;cursor:default}',
      '.skh-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-bg-base)}',
      '.skh-btn-primary:hover:not(:disabled){background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);opacity:.9}',
      '.skh-btn-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary);background:transparent}',
      '.skh-title-row{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}',
      '.skh-version{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:1px 5px}',
      '.skh-tabs{display:flex;gap:2px;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l1);overflow-x:auto;flex:none}',
      '.skh-tab{appearance:none;border:none;border-bottom:2px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);padding:8px 10px;margin-bottom:-1px;font:inherit;font-size:12px;line-height:1.4;cursor:pointer;white-space:nowrap}',
      '.skh-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.skh-tab-active{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}',
      '.skh-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));border-bottom:1px solid var(--dsw-alias-border-l1);flex:none}',
      '.skh-stat{display:flex;flex-direction:column;gap:1px;padding:10px 16px;border-right:1px solid var(--dsw-alias-border-l1);min-width:0}',
      '.skh-stat:last-child{border-right:none}',
      '.skh-stat-value{font-size:20px;line-height:1.2;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.02em}',
      '.skh-stat-label{font-size:10px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.skh-target-actions{display:flex;flex-direction:column;gap:4px}',
      '.skh-target-action{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:4px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.skh-target-action:last-child{border-bottom:none}',
      '.skh-toolbar{display:flex;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}',
      '.skh-client-filter{position:relative;flex:none}',
      '.skh-client-filter-btn{display:inline-flex;align-items:center;gap:6px;max-width:180px}',
      '.skh-client-filter-btn span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.skh-client-menu{position:absolute;z-index:4;top:calc(100% + 4px);left:0;min-width:196px;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);box-shadow:0 8px 24px rgba(0,0,0,.12)}',
      '.skh-client-option{appearance:none;width:100%;border:none;background:transparent;color:var(--dsw-alias-label-primary);display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;font:inherit;font-size:12px;text-align:left;cursor:pointer}',
      '.skh-client-option:hover,.skh-client-option[aria-selected="true"]{background:var(--dsw-alias-bg-layer-2)}',
      '.skh-mark{width:16px;height:16px;flex:none;display:inline-flex;align-items:center;justify-content:center}',
      '.skh-mark svg,.skh-mark img{width:16px;height:16px;display:block}',
      '.skh-input,.skh-select{appearance:none;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:5px 8px;font:inherit;font-size:12px;line-height:1.4;outline:none}',
      '.skh-input:focus,.skh-select:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.skh-search{flex:1;min-width:200px}',
      '.skh-chip{appearance:none;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:999px;padding:4px 10px;font:inherit;font-size:11px;line-height:1.4;cursor:pointer;display:inline-flex;align-items:center;gap:5px}',
      '.skh-chip[aria-pressed="true"]{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}',
      '.skh-status{padding:7px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12px;flex:none}',
      '.skh-status-error{color:var(--dsw-alias-state-error-primary)}',
      '.skh-status-notice{color:var(--dsw-alias-state-success-primary)}',
      '.skh-status-warn{color:var(--dsw-alias-state-warn-primary)}',
      '.skh-body{display:grid;grid-template-columns:minmax(260px,340px) minmax(0,1fr);flex:1;min-height:0}',
      '.skh-list{overflow:auto;padding:10px;border-right:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}',
      '.skh-group{margin-bottom:14px}',
      '.skh-group-head{display:flex;align-items:baseline;gap:6px}',
      '.skh-group-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary)}',
      '.skh-group-count{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.skh-group-hint{font-size:10px;color:var(--dsw-alias-label-secondary);opacity:.8;margin:1px 0 6px}',
      '.skh-row{display:grid;grid-template-columns:minmax(0,1fr) 22px;gap:8px;align-items:start;border:1px solid transparent;border-radius:8px;padding:9px 8px 8px;margin-bottom:2px;cursor:pointer;outline:none}',
      '.skh-row:hover{background:var(--dsw-alias-bg-layer-2)}',
      '.skh-row:focus-visible{border-color:var(--dsw-alias-brand-primary)}',
      '.skh-row-active{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l2)}',
      '.skh-row-main{min-width:0}',
      '.skh-row-title{display:flex;align-items:baseline;gap:6px;min-width:0}',
      '.skh-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;font-weight:650;letter-spacing:-.01em;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.skh-kind{flex:none;font-size:10px;line-height:1;letter-spacing:.02em;color:var(--dsw-alias-label-tertiary,var(--dsw-alias-label-secondary));padding-top:1px}',
      '.skh-kind-written{color:var(--dsw-alias-label-primary)}',
      '.skh-row-desc{margin-top:3px;font-size:12px;line-height:1.35;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.skh-clients{display:flex;align-items:center;gap:4px;margin-top:6px;min-width:0}',
      '.skh-client{flex:none;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center}',
      '.skh-client .skh-mark,.skh-client svg,.skh-client img{width:14px;height:14px}',
      '.skh-client-more{flex:none;font-size:10px;line-height:17px;color:var(--dsw-alias-label-secondary)}',
      '.skh-row-meta{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}',
      '.skh-star{appearance:none;border:none;background:transparent;color:var(--dsw-alias-label-secondary);padding:2px;cursor:pointer;flex:none;line-height:0}',
      '.skh-star:hover{color:var(--dsw-alias-state-warn-primary)}',
      '.skh-star-on{color:var(--dsw-alias-state-warn-primary)}',
      '.skh-badge{display:inline-flex;align-items:center;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;padding:0 6px;font-size:10px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.skh-badge-ok{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.skh-badge-warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.skh-badge-error{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.skh-detail{overflow:auto;padding:16px 20px;min-width:0}',
      '.skh-detail-head{display:flex;align-items:flex-start;gap:8px;flex-wrap:wrap}',
      '.skh-detail-title{font-size:15px;font-weight:600;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}',
      '.skh-detail-sub{margin-top:4px;display:flex;gap:6px;flex-wrap:wrap}',
      '.skh-path{margin-top:10px;display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;background:var(--dsw-alias-bg-layer-1);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;word-break:break-all}',
      '.skh-path-text{flex:1;min-width:0;color:var(--dsw-alias-label-secondary)}',
      '.skh-icon-btn{appearance:none;border:none;background:transparent;color:var(--dsw-alias-label-secondary);padding:2px;cursor:pointer;line-height:0;flex:none}',
      '.skh-icon-btn:hover{color:var(--dsw-alias-label-primary)}',
      '.skh-section{margin-top:18px}',
      '.skh-section-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);margin-bottom:6px}',
      '.skh-when{white-space:pre-wrap;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.skh-toggles{display:flex;gap:18px;flex-wrap:wrap;margin-top:16px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}',
      '.skh-switch{appearance:none;border:none;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;display:flex;align-items:flex-start;gap:8px;padding:0;cursor:pointer;text-align:left}',
      '.skh-switch:disabled{opacity:.55;cursor:default}',
      '.skh-switch-track{position:relative;display:inline-block;width:32px;height:18px;border-radius:999px;background:var(--dsw-alias-border-l2);flex:none;margin-top:1px;transition:background .15s}',
      '.skh-switch-thumb{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:left .15s}',
      '.skh-switch[aria-checked="true"] .skh-switch-track{background:var(--dsw-alias-state-success-primary)}',
      '.skh-switch[aria-checked="true"] .skh-switch-thumb{left:16px}',
      '.skh-switch-text{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.skh-switch-label{font-size:12px;font-weight:500}',
      '.skh-switch-hint{font-size:10px;color:var(--dsw-alias-label-secondary)}',
      '.skh-editor{width:100%;min-height:320px;margin-top:6px;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.55;resize:vertical;outline:none}',
      '.skh-editor:focus{border-color:var(--dsw-alias-brand-primary)}',
      '.skh-pre{white-space:pre-wrap;word-break:break-word;margin:6px 0 0;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.55}',
      '.skh-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}',
      '.skh-dirty{font-size:11px;color:var(--dsw-alias-state-warn-primary);margin-top:6px}',
      '.skh-clean{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:6px}',
      '.skh-note{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:10px;line-height:1.6}',
      '.skh-files{margin-top:12px;font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.skh-files summary{cursor:pointer;color:var(--dsw-alias-label-secondary)}',
      '.skh-files ul{margin:6px 0 0;padding-left:16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
      '.skh-files li{margin:1px 0;word-break:break-all}',
      '.skh-empty{color:var(--dsw-alias-label-secondary);text-align:center;padding:28px 16px;font-size:12px}',
      '.skh-empty-detail{color:var(--dsw-alias-label-secondary);padding:28px 8px;font-size:12px}',
      '.skh-form{display:flex;flex-direction:column;gap:12px;max-width:680px}',
      '.skh-field{display:flex;flex-direction:column;gap:4px}',
      '.skh-label{font-size:12px;font-weight:500}',
      '.skh-help{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.skh-form .skh-editor{min-height:240px}',
      '.skh-footer{display:flex;gap:12px;flex-wrap:wrap;padding:7px 16px;border-top:1px solid var(--dsw-alias-border-l1);font-size:10px;color:var(--dsw-alias-label-secondary);flex:none}',
      '.skh-footer span{min-width:0}',
      '.skh-spin{display:inline-block;width:12px;height:12px;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:skh-spin .8s linear infinite}',
      '@keyframes skh-spin{to{transform:rotate(360deg)}}',
      '.skh-sync{max-width:820px}',
      '.skh-sync-card{margin-top:14px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}',
      '.skh-sync-card .skh-input{width:100%}',
      '.skh-target-row{display:grid;grid-template-columns:minmax(120px,160px) minmax(0,1fr) 90px;gap:6px;align-items:center;margin-top:6px}',
      '.skh-target-row .skh-check{margin:0}',
      '.skh-sync-title{font-size:12px;font-weight:600;margin-bottom:5px}',
      '.skh-sync-line{display:flex;align-items:center;gap:8px;margin-top:12px}',
      '.skh-sync-line .skh-sync-title{margin:0}',
      '.skh-sync-line .skh-input{width:180px}',
      '.skh-check{display:flex;align-items:center;gap:6px;font-size:12px;margin-top:8px;cursor:pointer}',
      '.skh-sync-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px}',
      '.skh-sync-favorites{display:flex;flex-direction:column;margin-top:8px}',
      '.skh-sync-favorite{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:5px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}',
      '.skh-sync-result{margin-top:12px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1)}',
      '.skh-sync-results{margin-top:6px}',
      '.skh-sync-result-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:11px;padding:2px 0}',
      '@media (max-width:1100px){.skh-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.skh-stat:nth-child(3n){border-right:none}}',
      '@media (max-width:820px){.skh-body{grid-template-columns:1fr}.skh-list{border-right:none;border-bottom:1px solid var(--dsw-alias-border-l1);max-height:45%}.skh-detail{padding:14px}}',
      '@media (prefers-reduced-motion:reduce){.skh-spin{animation-duration:2.4s}}',
      '.skh-body.skh-body-plugins{display:flex;min-width:0;overflow:hidden}.skh-plugins{width:100%;max-width:100%;overflow-x:hidden;overflow-y:auto;container-type:inline-size}.skh-plugin-item,.skh-plugin-row,.skh-plugin-list,.skh-plugin-expanded{min-width:0;max-width:100%}.skh-plugins-head>div{min-width:0}.skh-plugins-head p,.skh-plugin-description{overflow-wrap:anywhere}.skh-plugins-heading{flex-wrap:wrap}.skh-plugin-columns,.skh-plugin-summary{grid-template-columns:minmax(0,1fr) 92px minmax(0,145px) 14px}.skh-plugin-states{min-width:0;overflow-wrap:anywhere}.skh-plugin-delivery{border-top:1px solid var(--dsw-alias-border-l1);margin-top:14px;padding-top:12px;min-width:0}.skh-plugin-delivery h4{font-size:12px;margin:0 0 6px}.skh-plugin-delivery code{display:block;white-space:pre-wrap;overflow-wrap:anywhere;font-size:10px;margin:5px 0;user-select:text}.skh-plugin-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.skh-plugin-actions select{width:auto;max-width:100%}.skh-plugin-preview{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:10px;margin-top:10px;min-width:0;overflow-wrap:anywhere;font-size:11px}.skh-plugin-preview .skh-btn{margin:6px 6px 0 0}.skh-plugin-preview select{max-width:100%}.skh-plugin-file-diff{border-top:1px solid var(--dsw-alias-border-l1);margin-top:10px;padding-top:8px}.skh-plugin-file-diff pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:180px;overflow:auto;font-size:10px}.skh-plugin-delivery .skh-check{align-items:flex-start;font-size:11px;white-space:normal}.skh-plugin-delivery .skh-check input{flex:none}',
      '@container(max-width:560px){.skh-plugin-columns{display:none}.skh-plugin-summary{grid-template-columns:minmax(0,1fr) minmax(0,110px) 12px;gap:8px}.skh-plugin-client{display:none}.skh-plugin-label{display:block}.skh-plugin-version{display:block}.skh-plugin-field{grid-template-columns:1fr;gap:2px}.skh-plugin-expanded{padding-left:8px}}',
    ].join('\n');

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    async function request(path, options = {}) {
      const headers = {};
      if (options.body !== undefined) {
        headers['content-type'] = 'application/json';
        headers['x-skill-hub'] = '1';
      }
      const response = await fetch(`${ENDPOINT}${path}`, {
        method: options.method ?? 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        credentials: 'same-origin',
        cache: 'no-store',
      });
      let body;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      if (!response.ok) {
        const error = new Error(
          body !== null && typeof body === 'object' && typeof body.error === 'string'
            ? body.error
            : `HTTP ${response.status}`,
        );
        error.status = response.status;
        throw error;
      }
      return body;
    }

    function identity(skill) {
      return skill.name;
    }

    function normalizeSkill(skill, fallbackLibrary) {
      return {
        ...skill,
        inLibrary: skill.inLibrary === true || (skill.inLibrary === undefined && fallbackLibrary === true),
        kind: skill.kind ?? (fallbackLibrary === true ? 'personal' : 'client'),
        clients: Array.isArray(skill.clients) ? skill.clients : [],
        clientIds: Array.isArray(skill.clientIds) ? skill.clientIds : [],
        targets: Array.isArray(skill.targets) ? skill.targets : [],
      };
    }

    function formatBytes(bytes) {
      if (!Number.isFinite(bytes) || bytes < 0) return '';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function makeTranslator(ctx) {
      let bound;
      try {
        bound = ctx.locale.bind(NS);
      } catch {
        bound = undefined;
      }
      return function translate(key, vars) {
        let text;
        try {
          text = bound === undefined ? key : bound(key);
        } catch {
          text = key;
        }
        if (typeof text !== 'string') text = key;
        if (vars !== undefined) {
          for (const [name, value] of Object.entries(vars)) {
            text = text.replaceAll(`{${name}}`, String(value));
          }
        }
        return text;
      };
    }

    function IconStar({ filled }) {
      return h(
        'svg',
        {
          width: 15,
          height: 15,
          viewBox: '0 0 24 24',
          fill: filled ? 'currentColor' : 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'm12 3.6 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8z' }),
      );
    }

    function IconRefresh() {
      return h(
        'svg',
        {
          width: 13,
          height: 13,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M20 11a8 8 0 1 0-2.3 5.7' }),
        h('path', { d: 'M20 4v7h-7' }),
      );
    }

    function IconPlus() {
      return h(
        'svg',
        {
          width: 13,
          height: 13,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M12 5v14M5 12h14' }),
      );
    }

    function IconCopy() {
      return h(
        'svg',
        {
          width: 13,
          height: 13,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('rect', { x: 8, y: 8, width: 11, height: 11, rx: 2 }),
        h('path', { d: 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2' }),
      );
    }

    function IconTrash() {
      return h(
        'svg',
        {
          width: 13,
          height: 13,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M4 7h16M9 7V5h6v2M6 7l1 14h10l1-14M10 11v6M14 11v6' }),
      );
    }


    const BRANDS = {
      codex:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill="#10a37f" d="M6.13671 5.82399V4.30398C6.13671 4.17596 6.18431 4.07991 6.29527 4.01598L9.32406 2.256C9.73637 2.01602 10.228 1.90406 10.7353 1.90406C12.6382 1.90406 13.8434 3.3921 13.8434 4.97604C13.8434 5.088 13.8434 5.21602 13.8274 5.34404L10.6877 3.488C10.4975 3.37605 10.3071 3.37605 10.1168 3.488L6.13671 5.82399ZM13.209 11.7441V8.11195C13.209 7.88789 13.1138 7.72791 12.9236 7.61594L8.94344 5.27995L10.2437 4.5279C10.3547 4.46397 10.4499 4.46397 10.5609 4.5279L13.5896 6.28789C14.4619 6.79996 15.0484 7.88789 15.0484 8.94385C15.0484 10.1598 14.335 11.28 13.209 11.7441ZM5.20114 8.54404L3.90086 7.77608C3.78989 7.71215 3.7423 7.6161 3.7423 7.48808V3.96811C3.7423 2.25615 5.04259 0.960061 6.80278 0.960061C7.46883 0.960061 8.08714 1.18413 8.61056 1.58409L5.48672 3.40816C5.29649 3.52012 5.20129 3.68011 5.20129 3.90418L5.20114 8.54404ZM7.99999 10.176L6.13671 9.12005V6.8801L7.99999 5.82414L9.8631 6.8801V9.12005L7.99999 10.176ZM9.19719 15.0401C8.53113 15.0401 7.91282 14.816 7.3894 14.4161L10.5132 12.5919C10.7034 12.48 10.7987 12.3201 10.7987 12.096V7.45596L12.1149 8.22392C12.2258 8.28785 12.2734 8.3839 12.2734 8.51192V12.0319C12.2734 13.7438 10.9572 15.0401 9.19719 15.0401ZM5.43898 11.4721L2.41018 9.71211C1.53796 9.20003 0.95134 8.11211 0.95134 7.05615C0.95134 5.82414 1.68077 4.72016 2.80657 4.25611V7.9041C2.80657 8.12817 2.90177 8.28815 3.092 8.40012L7.05637 10.72L5.75609 11.4721C5.64513 11.5361 5.54993 11.5361 5.43898 11.4721ZM5.26465 14.0961C3.47278 14.0961 2.15658 12.736 2.15658 11.056C2.15658 10.928 2.17249 10.8 2.18826 10.672L5.3121 12.4961C5.50234 12.608 5.69273 12.608 5.88297 12.4961L9.8631 10.1762V11.6962C9.8631 11.8242 9.8155 11.9202 9.70454 11.9841L6.67574 13.7441C6.26344 13.9841 5.77199 14.0961 5.26465 14.0961ZM9.19719 16C11.1159 16 12.7174 14.624 13.0823 12.8C14.8582 12.3359 16 10.6559 16 8.944C16 7.82396 15.5243 6.73603 14.668 5.95201C14.7473 5.61598 14.7949 5.27995 14.7949 4.94407C14.7949 2.65612 12.9554 0.944002 10.8305 0.944002C10.4025 0.944002 9.99013 1.00794 9.57782 1.15201C8.86416 0.447988 7.88099 0 6.80278 0C4.88403 0 3.28254 1.37593 2.91768 3.19999C1.14173 3.66404 0 5.34404 0 7.056C0 8.17604 0.475669 9.26397 1.33197 10.048C1.25269 10.384 1.20509 10.72 1.20509 11.0559C1.20509 13.3438 3.04456 15.0559 5.16946 15.0559C5.59753 15.0559 6.00984 14.9921 6.42215 14.848C7.13565 15.552 8.11882 16 9.19719 16Z"/></svg>',
      claude:
        '<svg fill="#D97757" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>',
      cursor:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#1e1e20" fill-rule="evenodd" d="M22.106 5.68L12.5.135a.998.998 0 00-.998 0L1.893 5.68a.84.84 0 00-.419.726v11.186c0 .3.16.577.42.727l9.607 5.547a.999.999 0 00.998 0l9.608-5.547a.84.84 0 00.42-.727V6.407a.84.84 0 00-.42-.726zm-.603 1.176L12.228 22.92c-.063.108-.228.064-.228-.061V12.34a.59.59 0 00-.295-.51l-9.11-5.26c-.107-.062-.063-.228.062-.228h18.55c.264 0 .428.286.296.514z"/></svg>',
      agents:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#10b981" d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h2a5 5 0 0 1 5 5v1a3 3 0 0 1 1 2.23V17a3 3 0 0 1-3 3h-1.1A6 6 0 0 1 12 22a6 6 0 0 1-4.9-2H6a3 3 0 0 1-3-3v-1.77A3 3 0 0 1 4 13v-1a5 5 0 0 1 5-5h2V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2zm-3 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-6 5a4 4 0 0 0 6 0H9z"/></svg>',
      dsh: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAhKSURBVFhHrZd5bBTXHcdR/6iav5r2zx4q2NjG9q69u/b6Wts4xkaEcCotzQUhhZJSEM1BAkmEqrQEQRCKUm4IRCRgikOgCbRFSlSaQBraSEVKQ8CAMYcMe87xZmfmzZvZ+Va/t15jw+K2Un/SVzN7zPt93vsd8964cUMG4Bsj7r/Z39//7bNnz97//xCNRWMW8zXqC03TSjnnW4QQF4UQuuMIxh3BHC4Y3RfEHee2+GjZxaXbtnPR4nxLQtNKR0EUbmzb7nJdN4O8+UNXeeP7xeQjV1ButLwiyg2N6TgiYxh21ygIXdfLPM9L0B9E3vxickjOnXJ8PlJ8tOzREtKH6yaSyWTZcAgcx9lccO66LsaSIIliEnAKckaL/BZk23kIzp3N0vnJkye/JYQ4PwSQu9PhvXQ3wNgQBRCbOzkZCuF+Tb7HUZYKIbQhAP9OR/eScAXNArbN5eAFCHLOHacoyBCATznBHaFSdRQA9HsBCOGA87yT298J5HJyItJyXm4YwHU9KYLgYgikAMAdWDaXAFQZ5LsAwIoBOI4js71gnucNO9Z0Hac/O4MDBw/jUv+ArAyyS5cH8M7+Xnmfn7UDm3NYtg3PyxGcT1cq2TEBaJZk16/fwFt79mHlqjVYsvRXWL7iBax+5TeYOfdRVNY04YmFv0AqlZYzJTt85BjqW6bio48/kQ5JhUn0X7mGC32X5Qfb5vcGKDg/1Ps+mtu6MaGsBiXlIUysimBiZQQlFWFUh5pRWduMp5c9B8uyJTTZwUNHUFkbQyDSjnUb3kQ6reCDYyewb/8hzJn3FHp6j0oA07SKA9Cyk/Uc7EVJeQ0qg1HU1sVGqBWh+jZ5DUcnS5DHFizB5f4B+dzfznyBSNMUhBs7UdfchYfmPI7qcJsEauucha/OXZAAlm3fDUBNha7nL/Qh2tSOYLgRkWgrQnUxBCPNCISbEQy35BUhxRCKtmNSoAEPzpyHC32XJMQzK19BeaBRAtTUTUZj6zREmrqwfuPvKCQ+dUvOi4SAcy4B1q57HeNLKxGqb0F1TRTlVREEahuHQFoQCBEIKYYaWomGdlTVNmH6rDwEhWPp8udRHYphctcszP7xfGzZvgeMGTIJCYDeKcMADncYJYrneb5pmnhwxlws+vkvcfxPJ9Bz8D2sfe11zJr7UwkTCDXKUARCTaiJtCAcbcfkKQ+hIdYlV6KjayY+PH4CL770a5RURPDiy69C0zRZPfnyFDInRwFYNmeuJ8vLv3UrjmAoih0735LLSaVHDyiKgoOHDqN72mxMCtQhVB+ToaDrzl1v46+fnsaMOY+gIhCVIKEGyo8Y3nhzmxyH27zQKWVNjAIwLc6E68HL5fyr166jJtyA1S+vke9C27ZlPyAQsqtXr+PJp55GRXWdXIlItB2PzV+E0599jr6+S2hspbi3oq7xAYQbOvD+0Q/zAJwXyjv/VhQjAAzTZpzaqOP6yVQaLa0PYPqMudB1hpznSXISDUKmKCqeeHIxKqoiiDS0oaomivUb35C/vbp2A0oqQqhv7kRH90z0XcwnJj0/EoDybhiAGRazuYusafumxbFg4WKUTKzERx//RT5MnazQoAoQ/VcG0DFlunROeUGhWLhoKbqmzZaJSmW64tlVcuVGdteiABozmWkLqHpW/rh9x2587wcTsPBnS6hnyxDQi4R6fT6Z8k3n6B+OYVJ1BLWRFlTXNqC0olb2jfqmDjS0dOKTT0/L/9HzYwKoepZlrTyAZQtcGbiGjs5uTCitwNZtu+Qg5lC36++/goGr1+R3ZKtWr0FpeVCWbDDcJENCML9dt1G24MLSjwmQUQ3GTAeKnvUVLQvXA/Yf+D3KyqsQCIaxZ+8+WUJk7x0+imhTG955t0euhqKqeHje4xhfWoVIfQyVwXosXf7s8IvsvwJIKozpBkdGzfqKbhIIKCTrN2xCaVklyiqqsfKFl/Dlv77Gmb9/Icv0RyWTsGzFc0gmU0in01i8ZBkqqyOoCtZh3qMLsL/nEOLxhIQcCXEXwMmzZ++PpxlTmI2UwvyMlgVJ1U0YJsfW7btRF23C9384HsHaCOoamlETjiIUacTEigA6u6dL0LWvbcCSpSvwk0fmo61jKmLt3Tj+xz//5xyQACmmZzQLyQzz04qBtJoXhcNyPJz+/B9Y8czzaI61oyoQQvmkACoqg6gNR1EXbUb3tJnY+/a79IaDpumgZkahGem4CEB+Q0IAt5K6llRNxFO6n8wwJDMGCiAphcG0XbAsx5dfXcDhIx9g5+692LFrDw709MoGpKpyQ5WvFJc6py91p/ORAK7r5rdktDGMZ4zzac3CzaSWu5XSkUgTRF4pxZBXgjFMAccFPB+0z5dX4fmwbAdG1qLtltwjkmgnJEZs40YAyJ7vukObUrJ4hm22BDAYV8XNpEYgiKfZbRCFViK/GqS0wpBRGRTVgMpMMMOCkbWRtWxYFm2/aLNKvYN6iIAr94rDAHK3Q0eB4XPBucs3ylKqmVANB4MJVQwmtdzNhObfTGp+PKn78bTuJ9KMwuOnFMNPq4afUQ0qWZ96h6abvm6YPjMs38haPnXUrGX7lsV92+byUMIdJ+fQkuRnn6DDkHReOB5dvDI4NZ7SM7YLZHTbTyhZkJJSJtKqCUpURbeg6jY0wwaVrp7lMLIODMsBNTMqX4u7oNbOhQdHeBBuDrlc/mgmhMhomjZ1pO/hm3+eO1d2bTC9dTCuXByMq2y0NHYzSdJZPK2zRFpn1D/SCmPUyBSNlGWanmXU2nWSYTKWtZghZV7Sjey2G5dvyJnf84RMtmnTpvt6T5z47vFTp74zlk79D9rU23tfMV//Btfumph3iobTAAAAAElFTkSuQmCC',
    };

    function ClientMark({ id }) {
      const brand = BRANDS[id];
      if (brand === undefined) {
        const letter = String(id || '?').slice(0, 1).toUpperCase();
        return h(
          'svg',
          { className: 'skh-mark', viewBox: '0 0 24 24', 'aria-hidden': true },
          h('rect', { x: 1, y: 1, width: 22, height: 22, rx: 5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 }),
          h('text', { x: 12, y: 16, textAnchor: 'middle', fontSize: 11, fontFamily: 'ui-monospace,monospace', fill: 'currentColor' }, letter),
        );
      }
      if (id === 'dsh') {
        return h('img', { className: 'skh-mark', src: brand, alt: '' });
      }
      return h('span', { className: 'skh-mark', dangerouslySetInnerHTML: { __html: brand } });
    }

    function IconSync() {
      return h(
        'svg',
        {
          width: 13,
          height: 13,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
        },
        h('path', { d: 'M20 11a8 8 0 0 0-13.7-5.7L4 8' }),
        h('path', { d: 'M4 4v4h4' }),
        h('path', { d: 'M4 13a8 8 0 0 0 13.7 5.7L20 16' }),
        h('path', { d: 'M20 20v-4h-4' }),
      );
    }

    function SidebarIcon({ size = 18 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { display: 'block', flexShrink: 0 } },
        h('g', { stroke: 'var(--dsw-alias-label-primary, currentColor)', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' },
          h('path', {"d": "M5.25 19.25V6.75a2.5 2.5 0 0 1 2.5-2.5h8.5a2.5 2.5 0 0 1 2.5 2.5v4.1"}),
          h('path', {"d": "M7.8 8.1h5.7", "stroke": "var(--dsw-alias-label-secondary, currentColor)"}),
          h('path', {"d": "M7.8 11.1h3.7", "stroke": "var(--dsw-alias-label-secondary, currentColor)"}),
          h('path', {"d": "M17.15 13.2c.45 2.08 1.48 3.11 3.55 3.55-2.07.45-3.1 1.48-3.55 3.55-.44-2.07-1.47-3.1-3.55-3.55 2.08-.44 3.11-1.47 3.55-3.55Z"}),
          h('path', {"d": "M20.8 11.1c.18.84.6 1.26 1.45 1.44-.85.19-1.27.61-1.45 1.46-.18-.85-.6-1.27-1.45-1.46.85-.18 1.27-.6 1.45-1.44Z"}),
        ),
      );
    }

    function Badge({ children, tone = 'muted' }) {
      const className =
        tone === 'ok'
          ? 'skh-badge skh-badge-ok'
          : tone === 'warn'
            ? 'skh-badge skh-badge-warn'
            : tone === 'error'
              ? 'skh-badge skh-badge-error'
              : 'skh-badge';
      return h('span', { className }, children);
    }

    function Switch({ checked, onChange, label, hint, disabled }) {
      return h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': checked,
          className: 'skh-switch',
          onClick: onChange,
          disabled,
        },
        h('span', { className: 'skh-switch-track' }, h('span', { className: 'skh-switch-thumb' })),
        h(
          'span',
          { className: 'skh-switch-text' },
          h('span', { className: 'skh-switch-label' }, label),
          hint === undefined ? null : h('span', { className: 'skh-switch-hint' }, hint),
        ),
      );
    }

    function isWrittenSkill(skill) {
      return skill.inLibrary === true && skill.kind === 'personal';
    }

    function isCommunitySkill(skill) {
      return skill.inCatalog === true || (skill.inLibrary === true && skill.kind === 'collected');
    }

    function Row({ t, skill, active, busy, onSelect, onFavorite }) {
      const written = isWrittenSkill(skill);
      const community = isCommunitySkill(skill);
      const clients = [];
      const seen = new Set();
      for (const client of skill.clients ?? []) {
        if (client.id === 'library' || seen.has(client.id)) continue;
        seen.add(client.id);
        clients.push(client);
      }
      const shown = clients.slice(0, 4);
      const hidden = clients.length - shown.length;
      const kindLabel = written ? t('kind.personal') : null;
      const kindClass = 'skh-kind skh-kind-written';
      return h(
        'div',
        {
          className: active ? 'skh-row skh-row-active' : 'skh-row',
          role: 'button',
          tabIndex: 0,
          'aria-pressed': active,
          onClick: onSelect,
          onKeyDown(event) {
            if (event.target !== event.currentTarget) return;
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect();
            }
          },
        },
        h(
          'div',
          { className: 'skh-row-main' },
          h(
            'div',
            { className: 'skh-row-title' },
            h('span', { className: 'skh-name', title: skill.name }, skill.name),
            kindLabel ? h('span', { className: kindClass }, kindLabel) : null,
          ),
          h(
            'div',
            { className: 'skh-row-desc', title: skill.description || '' },
            skill.description || t('detail.noDescription'),
          ),
          shown.length === 0
            ? null
            : h(
                'div',
                { className: 'skh-clients', title: clients.map((client) => client.label ?? client.id).join(' · ') },
                shown.map((client) =>
                  h(
                    'span',
                    { className: 'skh-client', key: client.id, title: client.label ?? client.id },
                    h(ClientMark, { id: client.id }),
                  ),
                ),
                hidden > 0 ? h('span', { className: 'skh-client-more' }, t('client.more', { count: hidden })) : null,
              ),
        ),
        written
          ? null
          : h(
              'button',
              {
                type: 'button',
                className: community ? 'skh-star skh-star-on' : 'skh-star',
                title: community ? t('detail.unfavorite') : t('detail.favorite'),
                'aria-label': community ? t('detail.unfavorite') : t('detail.favorite'),
                'aria-pressed': community,
                disabled: busy,
                onClick(event) {
                  event.stopPropagation();
                  onFavorite();
                },
              },
              h(IconStar, { filled: community }),
            ),
      );
    }

    function CreateForm({ t, busy, onCreate, onCancel }) {
      const [form, setForm] = React.useState({
        root: 'personal',
        name: '',
        description: '',
        whenToUse: '',
        content: '',
      });
      const [error, setError] = React.useState('');
      const set = (field) => (event) => setForm((previous) => ({ ...previous, [field]: event.target.value }));
      const submit = (event) => {
        event.preventDefault();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.name) || form.description.trim() === '' || form.content.trim() === '') {
          setError(t('create.required'));
          return;
        }
        setError('');
        onCreate(form);
      };
      return h(
        'form',
        { className: 'skh-form', onSubmit: submit },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 8 } },
          h('div', { className: 'skh-title' }, t('create.title')),
          h(
            'button',
            { type: 'button', className: 'skh-btn', style: { marginLeft: 'auto' }, onClick: onCancel, disabled: busy },
            t('create.back'),
          ),
        ),
        h(
          'label',
          { className: 'skh-field' },
          h('span', { className: 'skh-label' }, t('create.root')),
          h(
            'select',
            { className: 'skh-select', value: form.root, onChange: set('root'), disabled: busy },
            h('option', { value: 'personal' }, t('create.rootPersonal')),
          ),
        ),
        h(
          'label',
          { className: 'skh-field' },
          h('span', { className: 'skh-label' }, t('create.name')),
          h('input', {
            className: 'skh-input',
            value: form.name,
            onChange: set('name'),
            placeholder: 'my-workflow',
            autoComplete: 'off',
            spellCheck: false,
            disabled: busy,
          }),
          h('span', { className: 'skh-help' }, t('create.nameHint')),
        ),
        h(
          'label',
          { className: 'skh-field' },
          h('span', { className: 'skh-label' }, t('create.description')),
          h('input', {
            className: 'skh-input',
            value: form.description,
            onChange: set('description'),
            placeholder: t('create.descriptionHint'),
            disabled: busy,
          }),
        ),
        h(
          'label',
          { className: 'skh-field' },
          h('span', { className: 'skh-label' }, t('create.whenToUse')),
          h('input', {
            className: 'skh-input',
            value: form.whenToUse,
            onChange: set('whenToUse'),
            placeholder: t('create.whenToUseHint'),
            disabled: busy,
          }),
        ),
        h(
          'label',
          { className: 'skh-field' },
          h('span', { className: 'skh-label' }, t('create.content')),
          h('textarea', {
            className: 'skh-editor',
            value: form.content,
            onChange: set('content'),
            placeholder: '# Workflow\n\n1. …',
            spellCheck: false,
            disabled: busy,
          }),
          h('span', { className: 'skh-help' }, t('create.contentHint')),
        ),
        error === '' ? null : h('div', { className: 'skh-status skh-status-error', role: 'alert' }, error),
        h(
          'div',
          { className: 'skh-actions' },
          h('button', { type: 'submit', className: 'skh-btn skh-btn-primary', disabled: busy }, busy ? h('span', { className: 'skh-spin' }) : null, t('create.submit')),
          h('button', { type: 'button', className: 'skh-btn', onClick: onCancel, disabled: busy }, t('create.cancel')),
        ),
      );
    }


    function syncFormFrom(status) {
      return {
        personalDir: status?.settings?.personalDir ?? '',
        gitRemote: status?.settings?.gitRemote ?? '',
        gitBranch: status?.settings?.gitBranch ?? 'main',
        autoDistribute: status?.settings?.autoDistribute === true,
        autoSync: status?.settings?.autoSync ?? false,
        targets: (status?.settings?.targets ?? status?.targets ?? []).map((target) => ({ ...target })),
      };
    }

    function whenText(iso) {
      if (typeof iso !== 'string' || iso === '') return '';
      try {
        return new Date(iso).toLocaleString();
      } catch {
        return iso;
      }
    }

    function stateLabelFor(t, state) {
      return t(`sync.state.${state}`);
    }

    function SyncPanel({ t, onBack, onChanged }) {
      const [status, setStatus] = React.useState(undefined);
      const [form, setForm] = React.useState(undefined);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');
      const [warning, setWarning] = React.useState('');
      const [last, setLast] = React.useState(undefined);
      const [targetsData, setTargetsData] = React.useState(undefined);

      const load = React.useCallback(async () => {
        setError('');
        try {
          const [payload, targetsPayload] = await Promise.all([
            request('/sync/status'),
            request('/targets').catch(() => undefined),
          ]);
          setStatus(payload.status);
          setForm(syncFormFrom(payload.status));
          setWarning(typeof payload.warning === 'string' ? payload.warning : '');
          if (targetsPayload !== undefined) setTargetsData(targetsPayload);
        } catch (caught) {
          setError(t('sync.loadFailed', { error: messageOf(caught) }));
        }
      }, [t]);

      React.useEffect(() => {
        load();
      }, [load]);

      const run = async (path, body, successKey) => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          const payload = await request(path, { method: 'POST', body: body ?? {} });
          if (payload.status !== undefined) {
            setStatus(payload.status);
            setForm(syncFormFrom(payload.status));
          }
          setWarning(typeof payload.warning === 'string' ? payload.warning : '');
          let result = payload.result ?? payload.restore ?? payload.install;
          if (result !== undefined && result !== null && result.distribution !== undefined) {
            result = result.distribution;
          }
          if (result !== undefined && result !== null && result.favorites !== undefined && typeof result.favorites.installed === 'number') {
            result = result.favorites;
          }
          setLast(result);
          if (result !== undefined && typeof result === 'object' && typeof result.error === 'string') {
            setError(t('sync.actionFailed', { error: result.error }));
          } else {
            setNotice(t(successKey));
          }
          const targetsPayload = await request('/targets').catch(() => undefined);
          if (targetsPayload !== undefined) setTargetsData(targetsPayload);
          onChanged?.();
          return payload;
        } catch (caught) {
          setError(t('sync.actionFailed', { error: messageOf(caught) }));
          return undefined;
        } finally {
          setBusy(false);
        }
      };

      if (status === undefined || form === undefined) {
        return h('div', { className: 'skh-empty-detail' }, error === '' ? t('sync.loading') : error);
      }

      const set = (field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setForm((previous) => ({ ...previous, [field]: value }));
      };
      const setTarget = (index, field) => (event) => {
        const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
        setForm((previous) => ({
          ...previous,
          targets: previous.targets.map((target, cursor) =>
            cursor === index ? { ...target, [field]: value } : target,
          ),
        }));
      };
      const stateLabel = (state) => t(`sync.state.${state}`);
      const repo = status.repo;
      const favorites = status.manifest.favorites;
      const summary = last ?? status.lastRestore;
      const summaryResults = Array.isArray(summary?.results) ? summary.results : [];
      const summaryIsCounts = typeof summary?.installed === 'number';
      const summaryIsDistribution = typeof summary?.linked === 'number';

      const summaryLines = [];
      if (summaryIsDistribution) {
        summaryLines.push(
          `${t('sync.linked')}: ${summary.linked} · ${t('sync.copied')}: ${summary.copied} · ${t('sync.present')}: ${summary.present} · ${t('sync.conflict')}: ${summary.conflicts} · ${t('sync.failed')}: ${summary.failed}`,
        );
      } else if (summaryIsCounts) {
        summaryLines.push(
          `${t('sync.resultInstalled', { count: summary.installed })} · ${t('sync.resultPresent', {
            count: summary.present,
          })} · ${t('sync.resultFailed', { count: summary.failed })} · ${t('sync.resultNeedsSource', {
            count: summary.needsSource,
          })}`,
        );
      } else if (summary !== undefined && summary !== null) {
        if (summary.changed !== undefined) summaryLines.push(`${t('sync.changed')}: ${String(summary.changed)}`);
        if (summary.commit !== undefined) summaryLines.push(`${t('sync.commit')}: ${String(summary.commit ?? '—')}`);
        if (summary.pushed !== undefined) summaryLines.push(`${t('sync.pushed')}: ${String(summary.pushed)}`);
        if (summary.reason !== undefined) summaryLines.push(`${t('sync.reason')}: ${String(summary.reason)}`);
      }

      return h(
        'div',
        { className: 'skh-sync' },
        h(
          'div',
          { className: 'skh-detail-head' },
          h('div', { className: 'skh-detail-title' }, t('sync.title')),
          h(
            'button',
            { type: 'button', className: 'skh-btn', onClick: onBack, disabled: busy },
            t('sync.back'),
          ),
        ),
        t('sync.help') === '' ? null : h('p', { className: 'skh-note' }, t('sync.help')),
        warning !== '' ? h('div', { className: 'skh-status skh-status-warn' }, warning) : null,
        error !== ''
          ? h('div', { className: 'skh-status skh-status-error', role: 'alert' }, error)
          : notice !== ''
            ? h('div', { className: 'skh-status skh-status-notice', role: 'status' }, notice)
            : null,
        h(
          'div',
          { className: 'skh-sync-card' },
          h('div', { className: 'skh-sync-title' }, t('sync.personalDir')),
          h('input', {
            className: 'skh-input',
            value: form.personalDir,
            placeholder: status.personalDir,
            onChange: set('personalDir'),
            disabled: busy,
            spellCheck: false,
          }),
          t('sync.personalDirHint') === '' ? null : h('div', { className: 'skh-help' }, t('sync.personalDirHint')),
          h('div', { className: 'skh-sync-title', style: { marginTop: 12 } }, t('sync.gitRemote')),
          h('input', {
            className: 'skh-input',
            value: form.gitRemote,
            placeholder: 'git@github.com:you/skills.git',
            onChange: set('gitRemote'),
            disabled: busy,
            spellCheck: false,
          }),
          h('div', { className: 'skh-help' }, t('sync.gitRemoteHint')),
          h(
            'div',
            { className: 'skh-sync-line' },
            h('span', { className: 'skh-sync-title' }, t('sync.branch')),
            h('input', {
              className: 'skh-input skh-branch',
              value: form.gitBranch,
              onChange: set('gitBranch'),
              disabled: busy,
              spellCheck: false,
            }),
          ),
          h(
            'label',
            { className: 'skh-check' },
            h('input', { type: 'checkbox', checked: form.autoDistribute, onChange: set('autoDistribute'), disabled: busy }),
            h('span', null, t('sync.autoDistribute')),
          ),
          h(
            'label',
            { className: 'skh-check' },
            h('input', { type: 'checkbox', checked: form.autoSync, onChange: set('autoSync'), disabled: busy }),
            h('span', null, t('sync.autoSync')),
          ),
          h('div', { className: 'skh-help' }, t('sync.settingsHint')),
          h(
            'div',
            { className: 'skh-actions' },
            h(
              'button',
              { type: 'button', className: 'skh-btn skh-btn-primary', disabled: busy, onClick: () => run('/settings', { ...form, restore: true }, 'sync.restored') },
              busy ? h('span', { className: 'skh-spin' }) : null,
              t('sync.saveRestore'),
            ),
            h('button', { type: 'button', className: 'skh-btn', disabled: busy, onClick: () => run('/settings', { ...form, restore: false }, 'sync.saved') }, t('sync.save')),
            h('button', { type: 'button', className: 'skh-btn', disabled: busy, onClick: () => run('/sync', {}, 'sync.synced') }, t('sync.syncNow')),
            h('button', { type: 'button', className: 'skh-btn', disabled: busy, onClick: () => run('/restore', {}, 'sync.restored') }, t('sync.restore')),
            h('button', { type: 'button', className: 'skh-btn', disabled: busy, onClick: () => run('/distribute', {}, 'sync.distributed') }, t('sync.distribute')),
            h('button', { type: 'button', className: 'skh-btn', disabled: busy, onClick: () => run('/distribute', { replaceConflicts: true }, 'sync.distributed') }, t('sync.distributeReplace')),
          ),
        ),
        h(
          'div',
          { className: 'skh-sync-card' },
          h('div', { className: 'skh-sync-title' }, t('sync.repo')),
          h(
            'div',
            { className: 'skh-sync-row' },
            h(Badge, { tone: repo.isRepo ? 'ok' : 'warn' }, repo.isRepo ? t('sync.repoYes') : t('sync.repoNo')),
            repo.isRepo
              ? h(Badge, { tone: repo.dirty ? 'warn' : 'muted' }, repo.dirty ? t('sync.repoDirty') : t('sync.repoClean'))
              : null,
            h(Badge, null, t('sync.manifest') + ': ' + status.manifest.count),
          ),
          h('div', { className: 'skh-help' }, `${t('sync.remote')}: ${repo.remote || status.settings.gitRemote || t('sync.none')}`),
          h('div', { className: 'skh-help' }, `${t('sync.personalDir')}: ${status.personalDir}`),
          repo.isRepo ? null : h('div', { className: 'skh-help' }, t('sync.firstSyncHint')),
        ),
        h(
          'div',
          { className: 'skh-sync-card' },
          h('div', { className: 'skh-sync-title' }, t('sync.targets')),
          h('div', { className: 'skh-help' }, t('sync.targetsHelp')),
          form.targets.map((target, index) =>
            h(
              'div',
              { className: 'skh-target-row', key: target.id },
              h(
                'label',
                { className: 'skh-check' },
                h('input', {
                  type: 'checkbox',
                  checked: target.enabled,
                  onChange: setTarget(index, 'enabled'),
                  disabled: busy,
                }),
                h('span', { className: 'skh-name' }, target.label),
              ),
              h('input', {
                className: 'skh-input',
                value: target.path,
                onChange: setTarget(index, 'path'),
                disabled: busy,
                spellCheck: false,
              }),
              h(
                'select',
                {
                  className: 'skh-select',
                  value: target.mode,
                  onChange: setTarget(index, 'mode'),
                  disabled: busy,
                },
                h('option', { value: 'link' }, t('sync.modeLink')),
                h('option', { value: 'copy' }, t('sync.modeCopy')),
              ),
            ),
          ),
          targetsData !== undefined && targetsData.skills.length > 0
            ? h(
                'div',
                { className: 'skh-sync-results' },
                h('div', { className: 'skh-section-title' }, t('detail.targets')),
                targetsData.skills.slice(0, 50).map((row) =>
                  h(
                    'div',
                    { className: 'skh-sync-result-row', key: row.name },
                    h('span', { className: 'skh-name' }, row.name),
                    h(
                      'span',
                      { className: 'skh-help' },
                      row.targets.map((target) => `${target.label}: ${stateLabel(target.state)}`).join(' · '),
                    ),
                  ),
                ),
              )
            : null,
          targetsData !== undefined && targetsData.discover.length > 0
            ? h(
                'div',
                { className: 'skh-sync-result' },
                h('div', { className: 'skh-section-title' }, `${t('sync.targetOnly')} (${targetsData.discover.length})`),
                t('sync.targetOnlyHelp') === '' ? null : h('div', { className: 'skh-help' }, t('sync.targetOnlyHelp')),
                targetsData.discover.slice(0, 50).map((item) =>
                  h(
                    'div',
                    { className: 'skh-sync-favorite', key: item.name },
                    h('span', { className: 'skh-name' }, item.name),
                    h('span', { className: 'skh-help' }, item.targets.map((target) => target.targetLabel).join(' · ')),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'skh-btn',
                        disabled: busy,
                        onClick: () =>
                          run(
                            '/favorite',
                            { name: item.name, clientId: item.targets[0]?.targetId, value: true },
                            'notice.favorited',
                          ),
                      },
                      t('sync.collect'),
                    ),
                  ),
                ),
              )
            : null,
        ),
        status.legacyCollected > 0
          ? h(
              'div',
              { className: 'skh-sync-card' },
              h('div', { className: 'skh-sync-title' }, `${t('sync.legacyTitle')} (${status.legacyCollected})`),
              h('div', { className: 'skh-help' }, t('sync.legacyHelp')),
              h(
                'div',
                { className: 'skh-actions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'skh-btn',
                    disabled: busy,
                    onClick: () => run('/cleanup-legacy', {}, 'sync.legacyCleaned'),
                  },
                  t('sync.cleanupLegacy'),
                ),
              ),
            )
          : null,
        h(
          'div',
          { className: 'skh-sync-card' },
          h(
            'div',
            { className: 'skh-sync-title' },
            `${t('sync.catalog')} · ${status.catalog?.count ?? 0} · ${t('sync.installable')} ${status.catalog?.installable ?? 0}`,
          ),
          h('div', { className: 'skh-help' }, t('sync.catalogHelp')),
          (status.catalog?.entries ?? []).slice(0, 50).map((entry) =>
            h(
              'div',
              { className: 'skh-sync-favorite', key: entry.name },
              h('span', { className: 'skh-name' }, entry.name),
              h('span', { className: 'skh-help' }, entry.sourceKind),
            ),
          ),
          h(
            'div',
            { className: 'skh-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'skh-btn',
                disabled: busy,
                onClick: () => run('/install-catalog', {}, 'sync.catalogInstalled'),
              },
              t('sync.installCatalog'),
            ),
          ),
        ),
        h(
          'div',
          { className: 'skh-sync-card' },
          h('div', { className: 'skh-sync-title' }, `${t('sync.manifest')} · ${t('sync.favorites')} ${status.manifest.count} · ${t('sync.installable')} ${status.manifest.installable}`),
          favorites.length === 0
            ? h('div', { className: 'skh-help' }, t('sync.noFavorites'))
            : h(
                'div',
                { className: 'skh-sync-favorites' },
                favorites.map((favorite) =>
                  h(
                    'div',
                    { className: 'skh-sync-favorite', key: favorite.name },
                    h('span', { className: 'skh-name' }, favorite.name),
                    h(
                      'span',
                      { className: 'skh-help' },
                      favorite.missing === true
                        ? t('sync.missing')
                        : favorite.kind === 'personal'
                          ? t('sync.kindPersonal')
                          : t('sync.kindCollected'),
                    ),
                    h(
                      Badge,
                      { tone: favorite.installable ? 'ok' : 'warn' },
                      favorite.installable ? t('sync.installableYes') : t('sync.installableNo'),
                    ),
                    favorite.reason ? h('span', { className: 'skh-help' }, favorite.reason) : null,
                  ),
                ),
              ),
          summary !== undefined && summary !== null
            ? h(
                'div',
                { className: 'skh-sync-result' },
                h(
                  'div',
                  { className: 'skh-section-title' },
                  summary.at === undefined ? t('sync.resultsTitle') : `${t('sync.lastRestore')}: ${whenText(summary.at)}`,
                ),
                summaryLines.map((line, index) => h('div', { className: 'skh-help', key: `line-${index}` }, line)),
                summaryResults.length === 0
                  ? null
                  : h(
                      'div',
                      { className: 'skh-sync-results' },
                      h('div', { className: 'skh-help' }, t('sync.resultsTitle')),
                      summaryResults.slice(0, 20).map((result, index) =>
                        h(
                          'div',
                          { className: 'skh-sync-result-row', key: `${result.name}-${index}` },
                          h('span', { className: 'skh-name' }, result.name),
                          h('span', { className: 'skh-help' }, result.state),
                          result.error ? h('span', { className: 'skh-help' }, result.error) : null,
                        ),
                      ),
                    ),
              )
            : null,
        ),
      );
    }

    function Detail({
      t,
      skill,
      detail,
      draft,
      setDraft,
      busy,
      detailLoading,
      onSave,
      onReset,
      onFavorite,
      onSaveAsMine,
      onDistribute,
      onCopy,
      onDelete,
      onToggleInvocation,
    }) {
      if (detailLoading && detail === undefined) {
        return h('div', { className: 'skh-empty-detail' }, h('span', { className: 'skh-spin' }), ' ', t('list.loading'));
      }
      if (detail === undefined) {
        return h('div', { className: 'skh-empty-detail' }, t('detail.select'));
      }
      const inLibrary = skill.inLibrary === true;
      const inCatalog = skill.inCatalog === true;
      const personal = inLibrary && skill.kind === 'personal';
      const dirty = draft !== detail.content;
      const kindLabel = personal ? t('kind.personal') : null;
      const badges = [
        kindLabel ? h(Badge, { key: 'kind', tone: 'ok' }, kindLabel) : null,
        skill.collectedFrom
          ? h(Badge, { key: 'collected-from' }, `${t('detail.collectedFrom', { client: skill.collectedFrom.label ?? skill.collectedFrom.id })}`)
          : null,
        detail.linked ? h(Badge, { key: 'link' }, t('badge.linked')) : null,
      ].filter(Boolean);
      const clientBadges = (skill.clients ?? [])
        .filter((client) => client.id !== 'library')
        .map((client) =>
          h(
            Badge,
            {
              key: client.id,
              tone: client.state === 'conflict' ? 'error' : client.state === 'missing' ? 'warn' : 'ok',
            },
            h(ClientMark, { id: client.id }),
            `${client.label ?? client.id}: ${stateLabelFor(t, client.state)}`,
          ),
        );
      const fileRows = detail.files.map((file) =>
        h('li', { key: file.path }, `${file.path} · ${formatBytes(file.bytes)}`),
      );
      const actions = [];
      if (inLibrary) {
        actions.push(
          h(
            'button',
            {
              key: 'save',
              type: 'button',
              className: 'skh-btn skh-btn-primary',
              onClick: onSave,
              disabled: busy || !detail.editable || !dirty,
            },
            t('detail.save'),
          ),
          h(
            'button',
            {
              key: 'reset',
              type: 'button',
              className: 'skh-btn',
              onClick: onReset,
              disabled: busy || !detail.editable || !dirty,
            },
            t('detail.reset'),
          ),
        );
        if (detail.deletable && !detail.linked) {
          actions.push(
            h(
              'button',
              { key: 'delete', type: 'button', className: 'skh-btn skh-btn-danger', onClick: onDelete, disabled: busy },
              h(IconTrash),
              t('detail.delete'),
            ),
          );
        }
      } else if (inCatalog || skill.kind === 'collected') {
        actions.push(
          h(
            'button',
            { key: 'favorite', type: 'button', className: 'skh-btn', onClick: onFavorite, disabled: busy },
            h(IconStar, { filled: true }),
            t('detail.unfavorite'),
          ),
          h(
            'button',
            { key: 'mine', type: 'button', className: 'skh-btn', onClick: onSaveAsMine, disabled: busy },
            t('detail.saveAsMine'),
          ),
        );
      }
      if (inLibrary && skill.kind === 'collected') {
        actions.push(
          h(
            'button',
            { key: 'mine', type: 'button', className: 'skh-btn', onClick: onSaveAsMine, disabled: busy },
            t('detail.saveAsMine'),
          ),
        );
      }
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'skh-detail-head' },
          h('div', { className: 'skh-detail-title' }, detail.name),
          inCatalog || skill.kind === 'collected'
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'skh-star skh-star-on',
                  onClick: onFavorite,
                  disabled: busy,
                  title: t('detail.unfavorite'),
                  'aria-label': t('detail.unfavorite'),
                  'aria-pressed': true,
                },
                h(IconStar, { filled: true }),
              )
            : null,
        ),
        h('div', { className: 'skh-detail-sub' }, badges),
        h(
          'div',
          { className: 'skh-path' },
          h('span', { className: 'skh-path-text' }, detail.path),
          h(
            'button',
            { type: 'button', className: 'skh-icon-btn', onClick: onCopy, title: t('detail.copyPath'), 'aria-label': t('detail.copyPath') },
            h(IconCopy),
          ),
        ),
        clientBadges.length > 0
          ? h(
              'div',
              { className: 'skh-section' },
              h('div', { className: 'skh-section-title' }, t('detail.clients')),
              h('div', { className: 'skh-row-meta' }, clientBadges),
            )
          : null,
        personal && Array.isArray(skill.targets) && skill.targets.length > 0
          ? h(
              'div',
              { className: 'skh-section' },
              h('div', { className: 'skh-section-title' }, t('detail.targets')),
              h(
                'div',
                { className: 'skh-target-actions' },
                skill.targets.map((target) =>
                  h(
                    'div',
                    { className: 'skh-target-action', key: target.id },
                    h(
                      Badge,
                      {
                        tone: target.state === 'conflict' ? 'error' : target.state === 'missing' ? 'warn' : 'ok',
                      },
                      `${target.label}: ${stateLabelFor(t, target.state)}`,
                    ),
                    target.state === 'conflict'
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'skh-btn',
                            disabled: busy,
                            onClick: () => onDistribute(target.id, true),
                          },
                          t('detail.replaceHere'),
                        )
                      : target.state === 'missing'
                        ? h(
                            'button',
                            {
                              type: 'button',
                              className: 'skh-btn',
                              disabled: busy,
                              onClick: () => onDistribute(target.id, false),
                            },
                            t('detail.distributeTo'),
                          )
                        : null,
                  ),
                ),
              ),
              h('div', { className: 'skh-note' }, t('detail.targetsHelp')),
            )
          : null,
        detail.whenToUse
          ? h(
              'div',
              { className: 'skh-section' },
              h('div', { className: 'skh-section-title' }, t('detail.whenToUse')),
              h('div', { className: 'skh-when' }, detail.whenToUse),
            )
          : null,
        inLibrary && detail.editable
          ? h(
              'div',
              { className: 'skh-toggles' },
              h(Switch, {
                checked: detail.modelInvocable,
                onChange: () => onToggleInvocation('model'),
                label: t('detail.modelToggle'),
                hint: t('detail.modelHint'),
                disabled: busy,
              }),
              h(Switch, {
                checked: detail.userInvocable,
                onChange: () => onToggleInvocation('user'),
                label: t('detail.userToggle'),
                hint: t('detail.userHint'),
                disabled: busy,
              }),
            )
          : null,
        h(
          'div',
          { className: 'skh-section' },
          h('div', { className: 'skh-section-title' }, t('detail.editor')),
          detail.editable
            ? h('textarea', {
                className: 'skh-editor',
                value: draft,
                onChange: (event) => setDraft(event.target.value),
                spellCheck: false,
                disabled: busy,
                'aria-label': t('detail.editor'),
              })
            : h('pre', { className: 'skh-pre' }, detail.content),
          detail.editable
            ? h('div', { className: dirty ? 'skh-dirty' : 'skh-clean' }, dirty ? t('detail.dirty') : t('detail.clean'))
            : h(
                'div',
                { className: 'skh-note' },
                personal
                  ? t('detail.readonlyNote')
                  : inLibrary
                    ? t('detail.legacyCollectedNote')
                    : '',
              ),
          detail.linked ? h('div', { className: 'skh-note' }, t('detail.linkedNote')) : null,
          actions.length > 0 ? h('div', { className: 'skh-actions' }, actions) : null,
          inLibrary && detail.editable ? h('div', { className: 'skh-note' }, t('detail.editNote')) : null,
        ),
        h(
          'details',
          { className: 'skh-files' },
          h('summary', null, t('detail.files', { count: detail.files.length })),
          detail.files.length === 0 ? h('div', null, t('detail.noFiles')) : h('ul', null, fileRows),
          h(
            'div',
            { style: { marginTop: 6 } },
            `${t('detail.digest')}: ${String(detail.digest ?? '').slice(0, 12)}…`,
          ),
        ),
      );
    }

    function pluginInstallPrompt(plugin, target, t) {
      const names = { cursor: 'Cursor', claude: 'Claude Code', codex: 'Codex', dsh: 'DSH' };
      const reference = JSON.stringify({ name: plugin.name, identifier: plugin.pluginId, version: plugin.version ?? 'unknown', sourceClient: names[plugin.client] ?? plugin.client, localPath: plugin.path ?? null });
      return t('delivery.prompt', { plugin: reference, target: names[target] ?? target });
    }

    function PluginDistribution({ plugin, t }) {
      const [target, setTarget] = React.useState(plugin.client === 'cursor' ? 'claude' : 'cursor');
      const [prompt, setPrompt] = React.useState('');
      const [copied, setCopied] = React.useState(false);
      const [error, setError] = React.useState('');
      return h('section', { className: 'skh-plugin-delivery', 'aria-label': t('delivery.title') },
        h('h4', null, t('delivery.title')),
        h('p', { className: 'skh-note' }, t('delivery.help')),
        h('div', { className: 'skh-plugin-actions' },
          h('select', { className: 'skh-input', 'aria-label': t('delivery.target'), value: target, onChange: e => { setTarget(e.target.value); setPrompt(''); setCopied(false); setError(''); } },
            ...[['cursor','Cursor'],['claude','Claude Code'],['codex','Codex'],['dsh','DSH']].map(([id,name]) => h('option', { key: id, value: id }, name))),
          h('button', { className: 'skh-btn', onClick: () => { setPrompt(pluginInstallPrompt(plugin, target, t)); setCopied(false); setError(''); } }, t('delivery.generate'))),
        prompt ? h('div', { className: 'skh-plugin-preview' },
          h('textarea', { className: 'skh-input', rows: 5, readOnly: true, value: prompt, 'aria-label': t('delivery.generated'), style: { width: '100%', resize: 'vertical', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', font: 'inherit', fontSize: 12 } }),
          h('button', { className: 'skh-btn', onClick: async () => { try { await navigator.clipboard.writeText(prompt); setCopied(true); setError(''); } catch { setError(t('delivery.copyFailed')); } } }, t(copied ? 'delivery.copied' : 'delivery.copy')),
          copied ? h('span', { role: 'status', className: 'skh-note' }, t('delivery.copied')) : null) : null,
        error ? h('p', { role: 'alert' }, error) : null,
      );
    }

    function PluginsPanel({ t, query, clientFilter }) {
      const [inventory, setInventory] = React.useState();
      const [error, setError] = React.useState('');
      const [revision, setRevision] = React.useState(0);
      const [loading, setLoading] = React.useState(true);
      const [favoritesOnly, setFavoritesOnly] = React.useState(false);
      const [saving, setSaving] = React.useState(false);
      const toggleFavorite = async plugin => {
        setSaving(true); setError('');
        try {
          await request('/plugins/favorite', { method: 'POST', body: { key: plugin.favoriteKey, favorite: !plugin.favorite } });
          setRevision(n => n + 1);
        } catch (e) { setError(String(e.message)); }
        finally { setSaving(false); }
      };
      React.useEffect(() => {
        let current = true;
        setError('');
        setLoading(true);
        request('/plugins').then(value => { if (current) setInventory(value); })
          .catch(e => { if (current) setError(String(e.message)); })
          .finally(() => { if (current) setLoading(false); });
        return () => { current = false; };
      }, [revision]);
      const rows = (inventory?.plugins ?? []).filter(p => (!favoritesOnly || p.favorite) && (clientFilter === 'all' || clientFilter === p.client) &&
        [p.name, p.description, p.pluginId, p.version, p.path, p.scope, p.projectPath].some(v => String(v ?? '').toLowerCase().includes(query.toLowerCase())));
      const clientNames = { claude: 'Claude Code', cursor: 'Cursor', codex: 'Codex', dsh: 'DSH' };
      const field = (label, value) => value ? h('div', { className: 'skh-plugin-field' }, h('dt', null, label), h('dd', null, h('code', null, value))) : null;
      return h('section', { className: 'skh-plugins', 'aria-label': t('plugins.title'), 'aria-busy': loading },
        h('div', { className: 'skh-plugins-head' },
          h('div', null, h('div', { className: 'skh-plugins-heading' }, h('h2', null, t('plugins.title')),
            inventory ? h('span', { className: 'skh-plugins-count', role: 'status' }, t('plugins.count', { count: rows.length })) : null),
            h('p', null, t('plugins.summary')), h('p', null, t('plugins.favoriteHelp'))),
          h('button', { className: 'skh-btn', disabled: loading, title: t('plugins.refresh'), 'aria-label': t('plugins.refresh'), onClick: () => setRevision(n => n + 1) }, h(IconRefresh))),
        h('label', { className: 'skh-check', style: { marginBottom: 12 } }, h('input', { type: 'checkbox', checked: favoritesOnly, onChange: e => setFavoritesOnly(e.target.checked) }), t('plugins.favoritesOnly')),
        error ? h('p', { className: 'skh-status skh-status-error', role: 'alert' }, error) : null,
        loading ? h('p', { className: 'skh-note', role: 'status' }, t('plugins.loading')) : null,
        inventory?.warnings.length ? h('p', { className: 'skh-status skh-status-warn', role: 'status' }, t('plugins.warnings')) : null,
        inventory && rows.length === 0 && !loading ? h('div', { className: 'skh-plugin-empty' }, t('plugins.empty')) : null,
        rows.length ? h('div', { className: 'skh-plugin-columns', 'aria-hidden': true },
          h('span', null, t('plugins.title')), h('span', null, t('plugins.client')), h('span', null, t('plugins.state')), h('span')) : null,
        h('div', { className: 'skh-plugin-list' }, ...rows.map(p => h('div', { key: p.id, className: 'skh-plugin-item' },
          h('button', { className: 'skh-icon-btn skh-plugin-star', disabled: saving || loading, title: t(p.favorite ? 'detail.unfavorite' : 'detail.favorite'), 'aria-label': t(p.favorite ? 'detail.unfavorite' : 'detail.favorite') + ' ' + p.name, 'aria-pressed': p.favorite === true, onClick: () => toggleFavorite(p) }, h(IconStar, { filled: p.favorite })),
          h('details', { className: 'skh-plugin-row' },
          h('summary', { className: 'skh-plugin-summary', title: t('plugins.details') },
            h('div', { className: 'skh-plugin-name' }, h(ClientMark, { id: p.client }),
              h('div', { className: 'skh-plugin-label' }, h('strong', null, p.name),
                h('span', { className: 'skh-plugin-version', title: p.version ?? t('plugins.version') }, p.version ?? t('plugins.version')))),
            h('span', { className: 'skh-plugin-client' }, clientNames[p.client] ?? p.client),
            h('div', { className: 'skh-plugin-states' },
              h('span', { className: 'skh-plugin-state ' + (p.installation === 'recorded' ? 'is-recorded' : '') }, t('plugins.' + p.installation)),
              p.files === 'missing' ? h('span', { className: 'skh-plugin-state is-missing' }, t('plugins.missing')) : null),
            h('span', { className: 'skh-plugin-chevron', 'aria-hidden': true }, '›')),
          h('div', { className: 'skh-plugin-expanded' },
            p.description ? h('p', { className: 'skh-plugin-description' }, p.description) : null,
            h('dl', null,
              field(t('plugins.identity'), p.pluginId),
              field(t('plugins.location'), p.path),
              field(t('plugins.project'), p.projectPath),
              field(t('plugins.evidence'), p.evidence)),
            h('div', { className: 'skh-plugin-footnote' }, p.scope ? p.scope + ' · ' : '', t('plugins.unknown')),
            h(PluginDistribution, { plugin: p, t }),
          ),
        )))),
      );
    }

    function Panel({ t }) {
      const [data, setData] = React.useState(undefined);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');
      const [query, setQuery] = React.useState('');
      const [filter, setFilter] = React.useState('all');
      const [clientFilter, setClientFilter] = React.useState('all');
      const [clientMenuOpen, setClientMenuOpen] = React.useState(false);
      const [selectedKey, setSelectedKey] = React.useState(undefined);
      const [mode, setMode] = React.useState('browse');
      const [detail, setDetail] = React.useState(undefined);
      const [detailLoading, setDetailLoading] = React.useState(false);
      const [draft, setDraft] = React.useState('');
      const [tick, setTick] = React.useState(0);
      const [busy, setBusy] = React.useState(false);

      const allSkills = React.useMemo(
        () =>
          data === undefined
            ? []
            : Array.isArray(data.skills)
              ? data.skills.map((skill) => normalizeSkill(skill, skill.inLibrary === undefined))
              : data.groups.flatMap((entry) =>
                  entry.skills.map((skill) => normalizeSkill(skill, entry.key === 'personal')),
                ),
        [data],
      );
      const selected = React.useMemo(
        () => allSkills.find((skill) => identity(skill) === selectedKey),
        [allSkills, selectedKey],
      );
      const selectedIdentity = selected === undefined ? undefined : identity(selected);

      const load = React.useCallback(async (selectPath) => {
        setLoading(true);
        setError('');
        try {
          const next = await request('/list');
          setData(next);
          const items = Array.isArray(next.skills) ? next.skills : next.groups.flatMap((entry) => entry.skills);
          setSelectedKey((previous) => {
            if (selectPath !== undefined) {
              const found = items.find((skill) => skill.path === selectPath);
              if (found !== undefined) return identity(found);
            }
            if (previous !== undefined && items.some((skill) => identity(skill) === previous)) return previous;
            return items.length === 0 ? undefined : identity(items[0]);
          });
          return next;
        } catch (caught) {
          setError(t('error.load', { error: messageOf(caught) }));
          return undefined;
        } finally {
          setLoading(false);
        }
      }, [t]);

      React.useEffect(() => {
        load();
      }, [load]);

      React.useEffect(() => {
        if (mode !== 'browse' || selected === undefined || selected.path === undefined || selected.path === null) {
          setDetail(undefined);
          setDraft('');
          return undefined;
        }
        let cancelled = false;
        setDetail(undefined);
        setDraft('');
        setDetailLoading(true);
        setError('');
        request(
          `/read?name=${encodeURIComponent(selected.name)}&path=${encodeURIComponent(selected.path)}`,
        )
          .then((next) => {
            if (cancelled) return;
            setDetail(next);
            setDraft(next.content);
          })
          .catch((caught) => {
            if (!cancelled) setError(t('error.read', { error: messageOf(caught) }));
          })
          .finally(() => {
            if (!cancelled) setDetailLoading(false);
          });
        return () => {
          cancelled = true;
        };
      }, [mode, selectedIdentity, tick, t]);

      const refresh = React.useCallback(async (selectPath) => {
        const next = await load(selectPath);
        setTick((value) => value + 1);
        return next;
      }, [load]);

      const run = React.useCallback(async (work, successMessage, selectPath) => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          const result = await work();
          setNotice(successMessage(result));
          await refresh(selectPath);
          return result;
        } catch (caught) {
          setError(t('error.generic', { error: messageOf(caught) }));
          return undefined;
        } finally {
          setBusy(false);
        }
      }, [refresh, t]);

      const onSelect = (skill) => {
        setMode('browse');
        setSelectedKey(identity(skill));
      };

      const onFavorite = (skill) => {
        const clientId = (skill.clients ?? []).find((client) => client.id !== 'library')?.id;
        const value = isCommunitySkill(skill) ? false : true;
        run(
          () =>
            request('/favorite', {
              method: 'POST',
              body: { name: skill.name, clientId, value },
            }),
          () =>
            value
              ? t('notice.favorited', { name: skill.name })
              : t('notice.unfavorited', { name: skill.name }),
          undefined,
        );
      };

      const onSaveAsMine = (skill) => {
        const clientId = (skill.clients ?? []).find((client) => client.id !== 'library')?.id;
        run(
          () =>
            request('/save-as-mine', {
              method: 'POST',
              body: { name: skill.name, clientId },
            }),
          () => t('notice.savedAsMine', { name: skill.name }),
          undefined,
        );
      };

      const onDistribute = (skill, targetId, replace) => {
        run(
          () =>
            request('/distribute-skill', {
              method: 'POST',
              body: { name: skill.name, targetIds: [targetId], replaceConflicts: replace === true },
            }),
          () => t('notice.distributed'),
          skill.path,
        );
      };

      const onToggleInvocation = (field) => {
        if (selected === undefined) return;
        const body = {
          name: selected.name,
          path: selected.path,
          cwd: data?.cwd,
        };
        if (field === 'model') body.modelInvocable = !detail?.modelInvocable;
        else body.userInvocable = !detail?.userInvocable;
        run(
          () => request('/set-invocation', { method: 'POST', body }),
          () => t('notice.invocation'),
          selected.path,
        );
      };

      const onSave = () => {
        if (selected === undefined || detail === undefined) return;
        run(
          () => request('/save', {
            method: 'POST',
            body: {
              name: selected.name,
              path: selected.path,
              cwd: data?.cwd,
              content: draft,
              expectedDigest: detail.digest,
            },
          }),
          () => t('notice.saved'),
          selected.path,
        );
      };

      const onReset = () => {
        if (detail !== undefined) setDraft(detail.content);
      };

      const onCopy = async () => {
        if (detail === undefined) return;
        try {
          await navigator.clipboard.writeText(detail.path);
          setNotice(t('notice.copied'));
        } catch {
          setNotice(detail.path);
        }
      };

      const onDelete = () => {
        if (selected === undefined) return;
        if (!window.confirm(t('confirm.delete', { name: selected.name }))) return;
        run(
          () => request('/delete', {
            method: 'POST',
            body: { name: selected.name, path: selected.path, cwd: data?.cwd, confirm: true },
          }),
          () => t('notice.deleted'),
          undefined,
        );
      };

      const onCreate = async (form) => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          const result = await request('/create', {
            method: 'POST',
            body: { ...form, cwd: data?.cwd },
          });
          setNotice(t('notice.created', { name: result.name }));
          setMode('browse');
          await refresh(result.path);
        } catch (caught) {
          setError(t('error.create', { error: messageOf(caught) }));
        } finally {
          setBusy(false);
        }
      };

      const needle = query.trim().toLowerCase();
      const isWritten = isWrittenSkill;
      const isCollected = isCommunitySkill;
      const matchesFilter = (skill) => {
        if (filter === 'library' && !isWritten(skill) && !isCollected(skill)) return false;
        if (clientFilter !== 'all') return (skill.clientIds ?? []).includes(clientFilter);
        return true;
      };
      const filteredSkills =
        data === undefined
          ? []
          : allSkills.filter((skill) => {
              if (!matchesFilter(skill)) return false;
              if (needle === '') return true;
              return [
                skill.name,
                skill.description,
                skill.path ?? '',
                ...(skill.clients ?? []).map((client) => client.label ?? ''),
              ].some((value) => String(value).toLowerCase().includes(needle));
            });

      const stats = {
        total: allSkills.length,
        library: allSkills.filter((skill) => isWritten(skill) || isCollected(skill)).length,
        written: allSkills.filter(isWritten).length,
        collected: allSkills.filter(isCollected).length,
        clients: allSkills.filter((skill) => !isWritten(skill) && !isCollected(skill)).length,
        conflicts: allSkills.reduce(
          (sum, skill) => sum + (skill.targets ?? []).filter((target) => target.state === 'conflict').length,
          0,
        ),
      };

      let listContent;
      if (loading && data === undefined) {
        listContent = h('div', { className: 'skh-empty' }, h('span', { className: 'skh-spin' }), ' ', t('list.loading'));
      } else if (filteredSkills.length === 0) {
        listContent = h('div', { className: 'skh-empty' }, t('list.empty'));
      } else {
        listContent = h(
          'section',
          { className: 'skh-group' },
          h(
            'div',
            { className: 'skh-group-head' },
            h('span', { className: 'skh-group-title' }, filter === 'library' ? t('panel.mySkills') : t('panel.allSkills')),
            h('span', { className: 'skh-group-count' }, filteredSkills.length),
          ),
          filteredSkills.map((skill) =>
            h(Row, {
              key: identity(skill),
              t,
              skill,
              active: identity(skill) === selectedKey,
              busy,
              onSelect: () => onSelect(skill),
              onFavorite: () => onFavorite(skill),
            }),
          ),
        );
      }

      let detailContent;
      if (mode === 'sync') {
        detailContent = h(SyncPanel, {
          t,
          onBack: () => setMode('browse'),
          onChanged: () => {
            refresh();
          },
        });
      } else if (mode === 'create') {
        detailContent = h(CreateForm, {
          t,
          busy,
          onCreate,
          onCancel: () => setMode('browse'),
        });
      } else if (selected === undefined) {
        detailContent = h('div', { className: 'skh-empty-detail' }, t('detail.select'));
      } else {
        detailContent = h(Detail, {
          t,
          skill: selected,
          detail,
          draft,
          setDraft,
          busy,
          detailLoading,
          onSave,
          onReset,
          onFavorite: () => onFavorite(selected),
          onSaveAsMine: () => onSaveAsMine(selected),
          onDistribute: (targetId, replace) => onDistribute(selected, targetId, replace),
          onCopy,
          onDelete,
          onToggleInvocation,
        });
      }

      const status =
        error !== ''
          ? h('div', { className: 'skh-status skh-status-error', role: 'alert' }, error)
          : notice !== ''
            ? h('div', { className: 'skh-status skh-status-notice', role: 'status' }, notice)
            : data?.complete === false
              ? h('div', { className: 'skh-status skh-status-warn', role: 'status' }, t('panel.incomplete'))
              : null;

      const clientChoices = [
        { id: 'all', label: t('panel.allClients') },
        ...(data?.clients ?? []).filter((client) => client.id !== 'library'),
      ];
      const selectedClient = clientChoices.find((client) => client.id === clientFilter) ?? clientChoices[0];

      return h(
        'div',
        { className: 'skh-root' },
        h('style', null, css),
        h(
          'header',
          { className: 'skh-header' },
          h(
            'div',
            { className: 'skh-heading' },
            h(
              'div',
              { className: 'skh-title-row' },
              h('div', { className: 'skh-title' }, t('panel.title')),
              h('span', { className: 'skh-version' }, `v${VERSION}`),
            ),
            t('panel.subtitle') === '' ? null : h('div', { className: 'skh-subtitle' }, t('panel.subtitle')),
          ),
          h(
            'div',
            { className: 'skh-header-actions' },
            h(
              'button',
              { type: 'button', className: 'skh-btn', onClick: () => load(), disabled: loading || busy },
              h(IconRefresh),
              t('panel.refresh'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'skh-btn',
                onClick: () => {
                  setMode('sync');
                  setSelectedKey(undefined);
                  setNotice('');
                  setError('');
                },
                disabled: busy,
              },
              h(IconSync),
              t('panel.sync'),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'skh-btn skh-btn-primary',
                onClick: () => {
                  setMode('create');
                  setSelectedKey(undefined);
                  setNotice('');
                  setError('');
                },
                disabled: busy,
              },
              h(IconPlus),
              t('panel.create'),
            ),
          ),
        ),
        h(
          'div',
          { className: 'skh-tabs' },
          [
            ['all', t('panel.allSkills')],
            ['library', t('panel.mySkills')],
            ['plugins', t('plugins.title')],
          ].map(([key, label]) =>
            h(
              'button',
              {
                key,
                type: 'button',
                className: mode === 'browse' && filter === key ? 'skh-tab skh-tab-active' : 'skh-tab',
                onClick: () => {
                  setMode('browse');
                  setFilter(key);
                },
              },
              label,
            ),
          ),
        ),
        filter === 'plugins' && mode === 'browse' ? null : h(
          'div',
          { className: 'skh-stats' },
          [
            ['total', stats.total, t('stats.total')],
            ['library', stats.library, t('stats.library')],
            ['written', stats.written, t('stats.written')],
            ['collected', stats.collected, t('stats.collected')],
            ['conflicts', stats.conflicts, t('stats.conflicts')],
          ].map(([key, value, label]) =>
            h(
              'div',
              { className: 'skh-stat', key },
              h('span', { className: 'skh-stat-value' }, value),
              h('span', { className: 'skh-stat-label' }, label),
            ),
          ),
        ),
        h(
          'div',
          { className: 'skh-toolbar' },
          h(
            'div',
            { className: 'skh-client-filter' },
            h(
              'button',
              {
                type: 'button',
                className: 'skh-btn skh-client-filter-btn',
                'aria-label': t('panel.clientFilter'),
                'aria-haspopup': 'listbox',
                'aria-expanded': clientMenuOpen,
                onClick: () => setClientMenuOpen((open) => !open),
              },
              selectedClient.id === 'all' ? null : h(ClientMark, { id: selectedClient.id }),
              h('span', null, selectedClient.label),
            ),
            clientMenuOpen
              ? h(
                  'div',
                  { className: 'skh-client-menu', role: 'listbox', 'aria-label': t('panel.clientFilter') },
                  clientChoices.map((client) =>
                    h(
                      'button',
                      {
                        key: client.id,
                        type: 'button',
                        role: 'option',
                        className: 'skh-client-option',
                        'aria-selected': client.id === clientFilter,
                        onClick: () => {
                          setClientFilter(client.id);
                          setClientMenuOpen(false);
                        },
                      },
                      client.id === 'all' ? h('span', { className: 'skh-mark' }) : h(ClientMark, { id: client.id }),
                      client.label,
                    ),
                  ),
                )
              : null,
          ),
          h('input', {
            className: 'skh-input skh-search',
            value: query,
            onChange: (event) => setQuery(event.target.value),
            placeholder: t('panel.searchPlaceholder'),
            'aria-label': t('panel.searchPlaceholder'),
            spellCheck: false,
          }),
        ),
        status,
        h(
          'div',
          { className: filter === 'plugins' && mode === 'browse' ? 'skh-body skh-body-plugins' : 'skh-body' },
          filter === 'plugins' && mode === 'browse' ? h(PluginsPanel, { t, query, clientFilter }) : h('aside', { className: 'skh-list' }, listContent),
          filter === 'plugins' && mode === 'browse' ? null : h('section', { className: 'skh-detail' }, detailContent),
        ),
        t('footer.note') === '' && t('footer.rule') === ''
          ? null
          : h(
              'footer',
              { className: 'skh-footer' },
              t('footer.note') === '' ? null : h('span', null, t('footer.note')),
              t('footer.rule') === '' ? null : h('span', null, t('footer.rule')),
            ),
      );
    }

    function apply(ctx) {
      ctx.effect(
        () => ctx.locale.register(NS, { zh, en }),
        'dsh-personal-skill-manager: dictionaries',
      );
      const t = makeTranslator(ctx);
      ctx.effect(
        () => ctx.slots.inject('main', () =>
          ctx.slots.register(
            { name: 'main', key: 'dsh-personal-skill-manager', locale: NS, inject: () => ({ t }) },
            Panel,
          )),
        'dsh-personal-skill-manager: main panel',
      );
      ctx.effect(
        () => ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'dsh-personal-skill-manager',
              order: 12,
              locale: NS,
              label: () => t('panel.title'),
            },
            SidebarIcon,
          )),
        'dsh-personal-skill-manager: sidebar entry',
      );
    }

    return { inject: ['slots', 'locale'], apply };
  },
});
