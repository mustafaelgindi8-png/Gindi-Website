/*
 * Gindi Studio — app logic
 * Two modes share the same screens:
 *   live : signed in with Supabase; data is shared by the whole company (see supabase/schema.sql)
 *   demo : sample data kept on this device only, with a role switcher
 */
(function(){
'use strict';

// ---------- text (Arabic, English) ----------
const L={
  tagline:['إدارة مشروعات التشطيب','Finishing project management'],
  viewAs:['تشاهد كـ','Viewing as'],
  r_manager:['المدير','Manager'], r_office:['المكتب الفني','Technical office'], r_site:['مهندس الموقع','Site engineer'], r_client:['العميل','Client'], r_pending:['بانتظار الموافقة','Awaiting approval'],
  t_home:['الرئيسية','Home'], t_projects:['المشروعات','Projects'], t_approvals:['الاعتمادات','Approvals'], t_custody:['العُهد','Custody'], t_treasury:['الخزينة','Treasury'], t_tasks:['المهام','Tasks'], t_site:['عهدتي','My custody'], t_client:['مشروعي','My project'], t_statement:['كشف الحساب','Statement'], t_account:['الحساب','Account'],
  egp:['ج.م','EGP'],
  demo:['نسخة تجريبية ببيانات افتراضية. تغييراتك تُحفظ على جهازك فقط.','Demo with sample data. Your changes are saved on this device only.'],
  reset:['إعادة البيانات التجريبية','Reset sample data'], resetDone:['تمت إعادة البيانات التجريبية','Sample data restored'],
  hello:['صباح الخير','Good morning'],
  homeSub:['ملخص الشركة اليوم','Company overview for today'],
  k_treasury:['رصيد الخزينة','Treasury balance'], k_pending:['بانتظار الاعتماد','Waiting for approval'], k_custody:['عُهد مع المهندسين','Custody with engineers'], k_active:['مشروعات جارية','Active projects'],
  items_n:['{n} مصروف','{n} expenses'], across:['في {n} حسابات','across {n} accounts'], engs_n:['مع {n} مهندسين','with {n} engineers'],
  attention:['يحتاج انتباهك','Needs your attention'], allGood:['لا شيء يحتاج انتباهك الآن','Nothing needs your attention right now'],
  a_pending:['{n} مصروفات بانتظار اعتمادك','{n} expenses waiting for your approval'], a_pendingM:['بإجمالي {v}','Totalling {v}'],
  a_over:['تجاوز ميزانية {i}','{i} is over budget'], a_overM:['{p}: صُرف {s} من {b}','{p}: {s} spent of {b}'],
  a_owes:['العميل عليه {v}','Client owes {v}'], a_owesM:['{p}: المصروف والأتعاب أكبر من المدفوع','{p}: spending and fees exceed payments'],
  a_short:['عهدة {e} لا تكفي','{e}\'s custody is short'], a_shortM:['المصروفات المعلقة أكبر من الرصيد بـ {v}','Pending expenses exceed the balance by {v}'],
  a_late:['{n} مهام متأخرة','{n} overdue tasks'], a_lateM:['أقدمها: {t}','Oldest: {t}'],
  a_requests:['{n} طلبات انضمام جديدة','{n} new join requests'], a_requestsM:['حدد دور كل شخص ومشروعاته','Set each person\'s role and projects'],
  recent:['آخر تحديثات المواقع','Latest site updates'],
  projSub:['{n} مشروعات','{n} projects'],
  progress:['نسبة الإنجاز','Progress'], paid:['المدفوع','Paid'], spent:['المصروف','Spent'], fee:['أتعاب الإشراف','Supervision fee'], balance:['رصيد العميل','Client balance'], remaining:['المتبقي','Remaining'],
  m2:['م²','m²'], client:['العميل','Client'], team:['فريق العمل','Team'],
  pt_overview:['نظرة عامة','Overview'], pt_budget:['ميزانية البنود','Item budgets'], pt_tasks:['المهام والملاحظات','Tasks & snags'], pt_statement:['كشف الحساب','Statement'],
  backTo:['→ كل المشروعات','← All projects'],
  feeModel:['طريقة حساب الأتعاب','How the fee is worked out'], fee_pct:['نسبة من المصروف','Percentage of spending'], fee_fixed:['مبلغ ثابت (يُستحق حسب الإنجاز)','Fixed amount (earned with progress)'],
  feeVal:['القيمة','Value'], showFee:['إظهار الأتعاب للعميل','Show the fee to the client'], save:['حفظ','Save'], saved:['تم الحفظ','Saved'],
  feeExplainPct:['{v}% من المصروف المعتمد','{v}% of approved spending'], feeExplainFixed:['{v} × نسبة الإنجاز','{v} × progress'],
  budget:['الميزانية','Budget'], pendingShort:['معلّق','Pending'], over:['تجاوز','Over'], near:['قارب','Near limit'], within:['ضمن الميزانية','Within budget'],
  budgetTotal:['إجمالي الميزانية','Total budget'],
  legend:['الأخضر معتمد، والمخطط معلّق بانتظار الاعتماد','Solid is approved, striped is waiting for approval'],
  date:['التاريخ','Date'], desc:['البيان','Description'], debit:['مدين','Debit'], credit:['دائن','Credit'], runBal:['الرصيد','Balance'],
  clientPay:['دفعة من العميل','Client payment'], feeLine:['أتعاب الإشراف حتى تاريخه','Supervision fee to date'], totals:['الإجمالي','Total'],
  shareWa:['مشاركة على واتساب','Share on WhatsApp'], copy:['نسخ الملخص','Copy summary'], copied:['تم النسخ','Copied'], copyFail:['لم يتم النسخ. حدّد النص يدويًا.','Copy failed. Select the text manually.'],
  stmtTitle:['كشف حساب','Statement of account'],
  approvalsSub:['مصروفات رفعها مهندسو الموقع','Expenses uploaded by site engineers'], approvalsRO:['الاعتماد من صلاحية المدير. يمكنك المتابعة فقط.','Approval is the manager\'s job. You can follow along.'],
  approve:['اعتماد','Approve'], reject:['رفض','Reject'], approved:['معتمد','Approved'], rejected:['مرفوض','Rejected'], pending:['معلّق','Pending'],
  didApprove:['تم اعتماد المصروف','Expense approved'], didReject:['تم رفض المصروف','Expense rejected'],
  noPending:['لا توجد مصروفات هنا','No expenses here'],
  willOver:['سيتجاوز ميزانية البند','Will push the item over budget'], custAfter:['العهدة بعد الاعتماد: {v}','Custody after approval: {v}'],
  fromCustody:['من عهدة {e}','From {e}\'s custody'], fromAcc:['مدفوع من {a}','Paid from {a}'],
  history:['السجل','History'], short:['العهدة لا تكفي','Custody short'],
  custodySub:['السلف النقدية مع مهندسي الموقع','Cash advances held by site engineers'],
  given:['المُسلَّم','Given'], spentApproved:['مصروف معتمد','Approved spending'], returned:['مُرتجع','Returned'], available:['الرصيد المتاح','Available balance'],
  giveCustody:['تسليم عهدة','Give custody'], transfer:['تحويل بين المهندسين','Transfer between engineers'], settle:['تسوية وإرجاع','Settle & return'],
  k_give:['تسليم عهدة','Custody given'], k_xfer:['تحويل عهدة','Custody transfer'], k_ret:['إرجاع عهدة','Custody returned'],
  noEngineers:['لا يوجد مهندسو موقع بعد. أضفهم من صفحة الحساب.','No site engineers yet. Add them from the Account page.'],
  treasurySub:['الحسابات البنكية والنقدية والمحافظ','Bank, cash and wallet accounts'],
  acc_bank:['البنك الأهلي المصري','National Bank of Egypt'], acc_cash:['الخزنة النقدية','Cash safe'], acc_wallet:['إنستاباي / فودافون كاش','InstaPay / Vodafone Cash'],
  ty_bank:['حساب بنكي','Bank account'], ty_cash:['نقدي','Cash'], ty_wallet:['محفظة إلكترونية','E-wallet'],
  recordPay:['تسجيل دفعة عميل','Record client payment'], directExp:['مصروف مباشر','Direct expense'],
  movements:['حركات الخزينة','Treasury movements'], totalBal:['إجمالي الأرصدة','Total balance'], noMoves:['لا توجد حركات بعد','No movements yet'],
  tasksSub:['مهام التنفيذ وملاحظات الاستلام','Work tasks and handover snags'],
  f_all:['الكل','All'], f_open:['مفتوحة','Open'], f_task:['مهام','Tasks'], f_snag:['ملاحظات','Snags'], f_done:['منتهية','Done'], f_mine:['المسندة لي','Assigned to me'],
  todo:['لم تبدأ','To do'], doing:['جارية','In progress'], done:['منتهية','Done'], late:['متأخرة','Overdue'],
  snag:['ملاحظة','Snag'], task:['مهمة','Task'],
  markDone:['تم','Done'], start:['ابدأ','Start'], addTask:['إضافة مهمة','Add task'], due:['الموعد','Due'], assignee:['المسؤول','Assignee'],
  didDone:['تم إنهاء المهمة','Task completed'], didStart:['بدأت المهمة','Task started'], didAddTask:['تمت إضافة المهمة','Task added'],
  noTasks:['لا توجد مهام هنا','No tasks here'],
  siteSub:['سجّل مصروفاتك من الموقع وتابع رصيدك','Log site expenses and track your balance'],
  myBal:['رصيد عهدتك','Your custody balance'], afterPending:['بعد المعلّق','After pending'], logExp:['تسجيل مصروف','Log expense'], updProg:['تحديث الإنجاز','Update progress'],
  myExp:['مصروفاتي','My expenses'], myTasks:['مهامي','My tasks'],
  e_project:['المشروع','Project'], e_item:['البند','Work item'], e_amount:['المبلغ (ج.م)','Amount (EGP)'], e_note:['البيان','Description'], e_receipt:['صورة الإيصال','Receipt photo'], e_source:['يُدفع من','Paid from'], e_vendor:['المورد','Supplier'],
  submitExp:['إرسال للاعتماد','Send for approval'], saveExp:['تسجيل المصروف','Record expense'],
  didLog:['تم إرسال المصروف للاعتماد','Expense sent for approval'], didDirect:['تم تسجيل المصروف','Expense recorded'],
  needAmount:['اكتب مبلغًا أكبر من صفر','Enter an amount greater than zero'], needTitle:['اكتب عنوان المهمة','Enter a task title'],
  overWarn:['هذا المصروف سيتجاوز ميزانية البند بـ {v}','This expense will push the item {v} over budget'],
  receiptHint:['اختياري. صوّر الفاتورة ليراها المكتب.','Optional. Photograph the invoice so the office can see it.'],
  engineer:['المهندس','Engineer'], fromEng:['من','From'], toEng:['إلى','To'], account:['الحساب','Account'],
  didGive:['تم تسليم العهدة','Custody given'], didXfer:['تم تحويل العهدة','Custody transferred'], didRet:['تم تسجيل الإرجاع','Return recorded'], didPay:['تم تسجيل الدفعة','Payment recorded'],
  sameEng:['اختر مهندسين مختلفين','Choose two different engineers'],
  prog_note:['ماذا تم في الموقع؟','What was done on site?'], didProg:['تم تحديث الإنجاز','Progress updated'],
  clientHello:['أهلًا {n}','Welcome, {n}'], clientSub:['تابع تنفيذ مشروعك لحظة بلحظة','Follow your project as it happens'],
  yourPayments:['دفعاتك','Your payments'], openSnags:['ملاحظات قيد الإصلاح','Snags being fixed'], whereMoney:['أين صُرفت دفعاتك','Where your payments went'],
  contactEng:['تواصل مع المهندس','Message your engineer'], noSnags:['لا توجد ملاحظات مفتوحة','No open snags'],
  dueNow:['مستحق عليك الآن','Due from you now'], credit_left:['متبقي من دفعاتك','Left from your payments'],
  receipt:['الإيصال','Receipt'], noReceipt:['لم يُرفق إيصال','No receipt attached'], close:['إغلاق','Close'], cancel:['إلغاء','Cancel'], loadingReceipt:['جارٍ تحميل الإيصال…','Loading receipt…'],
  today:['اليوم','Today'], yesterday:['أمس','Yesterday'],
  waText:['كشف حساب: {p}\nالمدفوع: {paid}\nالمصروف المعتمد: {spent}\nأتعاب الإشراف: {fee}\nرصيد العميل: {bal}\nنسبة الإنجاز: {prog}%\n— Gindi Studio','Statement: {p}\nPaid: {paid}\nApproved spending: {spent}\nSupervision fee: {fee}\nClient balance: {bal}\nProgress: {prog}%\n— Gindi Studio'],
  waTextNoFee:['ملخص مشروع: {p}\nالمدفوع: {paid}\nالمصروف: {spent}\nالرصيد: {bal}\nنسبة الإنجاز: {prog}%\n— Gindi Studio','Project summary: {p}\nPaid: {paid}\nSpent: {spent}\nBalance: {bal}\nProgress: {prog}%\n— Gindi Studio'],
  // sign in & onboarding
  signin:['تسجيل الدخول','Sign in'], signup:['إنشاء حساب','Create account'], email:['البريد الإلكتروني','Email'], password:['كلمة المرور','Password'], fullName:['الاسم بالكامل','Full name'], phone:['رقم الموبايل (اختياري)','Mobile number (optional)'],
  noAccount:['ليس لديك حساب؟','No account yet?'], haveAccount:['لديك حساب بالفعل؟','Already have an account?'], tryDemo:['جرّب النسخة التجريبية','Try the demo'],
  forgot:['نسيت كلمة المرور؟','Forgot password?'], sendReset:['إرسال رابط إعادة التعيين','Send reset link'], resetSent:['أرسلنا رابط إعادة التعيين إلى بريدك','We sent a reset link to your email'],
  newPass:['كلمة المرور الجديدة','New password'], setPass:['حفظ كلمة المرور','Save password'], passSaved:['تم حفظ كلمة المرور','Password saved'],
  checkEmail:['تحقق من بريدك','Check your email'], checkEmailM:['أرسلنا رابط تأكيد إلى {e}. افتحه ثم ارجع وسجّل الدخول.','We sent a confirmation link to {e}. Open it, then come back and sign in.'], backSignin:['العودة لتسجيل الدخول','Back to sign in'],
  authSub:['سجّل الدخول لمتابعة مشروعاتك','Sign in to follow your projects'], signupSub:['حساب واحد للمدير والمهندسين والعملاء','One account type for managers, engineers and clients'],
  onboardT:['خطوة أخيرة','One last step'], onboardM:['أنشئ شركتك، أو انضم لشركة بالكود الذي أرسله لك المدير.','Create your company, or join one with the code your manager sent you.'],
  createCo:['إنشاء شركة جديدة','Create a new company'], coName:['اسم الشركة','Company name'], createCoBtn:['إنشاء الشركة','Create company'], coHint:['ستصبح مدير الشركة.','You will be the company manager.'],
  joinCo:['الانضمام بكود','Join with a code'], joinCode:['كود الشركة','Company code'], joinBtn:['إرسال طلب الانضمام','Send join request'],
  pendingT:['طلبك قيد المراجعة','Your request is being reviewed'], pendingM:['طلبت الانضمام إلى {c}. سيحدد المدير دورك ومشروعاتك، ثم يفتح التطبيق تلقائيًا.','You asked to join {c}. The manager will set your role and projects, then the app opens automatically.'],
  refresh:['تحديث','Refresh'], signout:['تسجيل الخروج','Sign out'],
  company:['الشركة','Company'], yourRole:['دورك','Your role'], profile:['بياناتك','Your details'],
  inviteT:['دعوة فريقك وعملائك','Invite your team and clients'], inviteM:['أرسل لهم رابط التطبيق والكود. بعد التسجيل يظهرون هنا لتحدد دورهم.','Send them the app link and this code. After they sign up they appear here so you can set their role.'],
  codeLbl:['كود الانضمام','Join code'], sendInvite:['دعوة على واتساب','Invite on WhatsApp'], copyCode:['نسخ الدعوة','Copy invite'],
  inviteText:['أهلًا 👋\nتقدر تتابع مشروعك مع {c} على تطبيق Gindi Studio:\n\n1) افتح الرابط: {u}\n2) ثبّت التطبيق:\n   • آيفون: افتح الرابط في سفاري ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»\n   • أندرويد: افتح الرابط في كروم ← «تثبيت التطبيق»\n3) اضغط «إنشاء حساب» واكتب اسمك وبريدك وكلمة مرور\n4) اختر «الانضمام بكود» واكتب الكود: {k}\n\nبعد موافقتنا هيظهر لك مشروعك مباشرة.','Hello 👋\nYou can follow your project with {c} on the Gindi Studio app:\n\n1) Open the link: {u}\n2) Install the app:\n   • iPhone: open the link in Safari → Share → "Add to Home Screen"\n   • Android: open the link in Chrome → "Install app"\n3) Tap "Create account" and enter your name, email and a password\n4) Choose "Join with a code" and enter: {k}\n\nOnce we approve you, your project appears right away.'],
  requests:['طلبات الانضمام','Join requests'], members:['أعضاء الشركة','Company members'], role:['الدور','Role'], projectsAccess:['المشروعات','Projects'],
  remove:['إزالة من الشركة','Remove from company'], confirmRemove:['اضغط مرة أخرى لتأكيد الإزالة','Tap again to confirm removal'], didSetMember:['تم تحديث العضو','Member updated'], didRemove:['تمت إزالة العضو','Member removed'],
  noRequests:['لا توجد طلبات جديدة','No new requests'], clientNeedsProject:['اختر مشروع العميل','Choose the client\'s project'], editMember:['تعديل العضو','Edit member'], you:['أنت','You'],
  accountsT:['حسابات الخزينة','Treasury accounts'], accName:['اسم الحساب','Account name'], opening:['الرصيد الافتتاحي','Opening balance'], editAcc:['تعديل الحساب','Edit account'],
  newProject:['مشروع جديد','New project'], pName:['اسم المشروع','Project name'], pClient:['اسم العميل','Client name'], pLoc:['الموقع','Location'], pArea:['المساحة (م²)','Area (m²)'],
  itemsBudget:['البنود وميزانياتها (اترك الخانة فارغة لاستبعاد البند)','Work items and budgets (leave blank to skip)'], didProject:['تم إنشاء المشروع','Project created'], needName:['اكتب الاسم','Enter a name'],
  noProjects:['لا توجد مشروعات بعد','No projects yet'], firstProject:['أنشئ أول مشروع','Create your first project'], noAssigned:['لم يتم ربطك بأي مشروع بعد. اطلب من المدير إضافتك.','You haven\'t been added to a project yet. Ask your manager to add you.'],
  offline:['لا يوجد اتصال، تعرض آخر بيانات محفوظة','Offline, showing the last saved data'], netErr:['تعذّر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.','Couldn\'t connect. Check your internet and try again.'],
  err_code:['الكود غير صحيح','That code is not valid'], err_login:['البريد أو كلمة المرور غير صحيحة','Wrong email or password'], err_exists:['هذا البريد مسجل بالفعل. سجّل الدخول.','This email is already registered. Sign in instead.'], err_confirm:['أكّد بريدك أولًا من الرابط الذي أرسلناه','Confirm your email first using the link we sent'],
  err_generic:['حدث خطأ: {m}','Something went wrong: {m}'], err_denied:['ليست لديك صلاحية لهذا الإجراء','You don\'t have permission to do that'], passShort:['كلمة المرور 6 أحرف على الأقل','Password must be at least 6 characters'],
  wait:['لحظة…','One moment…'],
  exportX:['تصدير Excel','Export to Excel'], exportT:['تصدير البيانات','Export data'], allProjects:['كل المشروعات','All projects'], fromD:['من تاريخ','From'], toD:['إلى تاريخ','To'],
  periodHint:['اترك التاريخين فارغين لتصدير كل الفترات. الملخص وكشوف الحساب وميزانية البنود تشمل كل الفترات دائمًا.','Leave both dates empty to export everything. The summary, statements and item budgets always cover all dates.'],
  exportBtn:['تصدير الملف','Export file'], preparing:['جارٍ تجهيز أداة التصدير…','Getting the export ready…'], exported:['تم تجهيز الملف','File ready'], exportFail:['تعذّر تحميل أداة التصدير. تحقق من الإنترنت وحاول مرة أخرى.','Couldn\'t load the export tool. Check your internet and try again.'],
  exportIncludes:['يشمل الملف:','The file includes:'],
  sh_info:['معلومات','Info'], sh_summary:['ملخص المشروعات','Project summary'], sh_statement:['كشوف الحساب','Statements'], sh_exp:['المصروفات','Expenses'], sh_pay:['دفعات العملاء','Client payments'], sh_items:['ميزانية البنود','Item budgets'],
  sh_cust:['العهد','Custody'], sh_custmov:['حركات العهد','Custody movements'], sh_tre:['الخزينة','Treasury'], sh_tremov:['حركات الخزينة','Treasury movements'], sh_tasks:['المهام والملاحظات','Tasks & snags'],
  c_status:['الحالة','Status'], c_type:['النوع','Type'], c_details:['التفاصيل','Details'], c_in:['وارد','In'], c_out:['منصرف','Out'], c_used:['نسبة الصرف %','% used'], c_hasRcpt:['إيصال مرفق','Receipt attached'], yes:['نعم','Yes'], no:['لا','No'],
  c_area:['المساحة م²','Area m²'], c_progress:['الإنجاز %','Progress %'], c_location:['الموقع','Location'], c_feeModel:['طريقة الأتعاب','Fee method'], c_amount:['المبلغ','Amount'], k_exp:['مصروف','Expense'],
  exportedBy:['صدّر بواسطة','Exported by'], exportedAt:['تاريخ التصدير','Exported on'], period:['الفترة','Period'], allTime:['كل الفترات','All dates'], scope:['النطاق','Scope'], currency:['العملة','Currency'],
  otherItem:['+ بند آخر (اكتب اسمه)','+ Other item (type its name)'], itemNameLbl:['اسم البند','Item name'], needItemName:['اكتب اسم البند','Enter the item name'],
  addItemRow:['+ إضافة بند آخر','+ Add another item'], customItems:['بنود أخرى من اختيارك','Your own items'], editItems:['تعديل البنود والميزانيات','Edit items & budgets'], noBudget:['بدون ميزانية','No budget'], demoBadge:['تجريبي','Demo'],
};
const ITEMS={masonry:['مباني','Masonry'],plumbing:['سباكة','Plumbing'],electrical:['كهرباء','Electrical'],plaster:['محارة','Plastering'],tiles:['سيراميك وبورسلين','Tiles & porcelain'],paint:['دهانات','Paint'],gypsum:['جبس بورد','Gypsum board'],carpentry:['نجارة وأبواب','Carpentry & doors'],ac:['تكييف','Air conditioning'],aluminum:['ألوميتال','Aluminium']};

// ---------- icons ----------
const I=(p)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={
  home:I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
  projects:I('<path d="M3 7h6l2 2h10v10H3z"/>'),
  approvals:I('<path d="M9 12l2 2 4-4"/><rect x="4" y="3" width="16" height="18" rx="2"/>'),
  custody:I('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h2"/><path d="M3 10h18"/>'),
  treasury:I('<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M3 20h18"/>'),
  tasks:I('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
  site:I('<path d="M2 20h20"/><path d="M5 20V10l7-5 7 5v10"/><path d="M10 20v-5h4v5"/>'),
  client:I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  account:I('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  statement:I('<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7M9 8h3"/>'),
  plus:I('<path d="M12 5v14M5 12h14"/>'),
  x:I('<path d="M6 6l12 12M18 6L6 18"/>'),
  receipt:I('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
  share:I('<path d="M4 12v7h16v-7"/><path d="M12 3v12M7 8l5-5 5 5"/>'),
  copy:I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>'),
  up:I('<path d="M4 17l6-6 4 4 6-7"/>'),
  swap:I('<path d="M7 7h12l-3-3M17 17H5l3 3"/>'),
  download:I('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 19h16"/>'),
};

// ---------- backend ----------
const RECOVERY=/type=recovery/.test(location.hash);
const CFG=window.GINDI_APP_CONFIG||{};
const sb=(CFG.supabaseUrl&&CFG.supabaseAnonKey&&window.supabase&&window.supabase.createClient)
  ? window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
  : null;

// ---------- demo data ----------
const DEMO_KEY='gindi-studio-demo-v1', CACHE_KEY='gindi-studio-live-cache-v1';
const day=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toISOString().slice(0,10)};
const B=(ar,en)=>({ar,en});
function seed(){
  const d={
    people:{
      mgr:{name:B('م. مصطفى الجندي','Eng. Mostafa Elgindi'),role:'manager'},
      noha:{name:B('م. نهى فؤاد','Eng. Noha Fouad'),role:'office'},
      karim:{name:B('م. كريم سامي','Eng. Karim Samy'),role:'site'},
      youssef:{name:B('م. يوسف عادل','Eng. Youssef Adel'),role:'site'},
      hisham:{name:B('أ. هشام رضا','Mr. Hisham Reda'),role:'client'},
    },
    accounts:[{id:'bank',type:'bank',open:900000},{id:'cash',type:'cash',open:260000},{id:'wallet',type:'wallet',open:60000}],
    projects:[
      {id:'p1',name:B('شقة التجمع الخامس','New Cairo apartment'),client:B('أ. هشام رضا','Mr. Hisham Reda'),clientId:'hisham',area:180,loc:B('التجمع الخامس، القاهرة الجديدة','Fifth Settlement, New Cairo'),progress:62,fee:{type:'pct',v:12},showFee:true,team:['karim','noha'],
        items:[['masonry',60000],['plumbing',85000],['electrical',95000],['plaster',70000],['tiles',160000],['gypsum',55000],['paint',90000],['carpentry',120000]]},
      {id:'p2',name:B('فيلا الشيخ زايد','Sheikh Zayed villa'),client:B('د. منى خليل','Dr. Mona Khalil'),area:420,loc:B('الشيخ زايد، الجيزة','Sheikh Zayed, Giza'),progress:28,fee:{type:'fixed',v:180000},showFee:true,team:['youssef','noha'],
        items:[['masonry',340000],['plumbing',260000],['electrical',310000],['plaster',240000],['ac',380000],['tiles',450000],['paint',180000],['aluminum',220000]]},
      {id:'p3',name:B('مكتب إداري — المعادي','Maadi office fit-out'),client:B('شركة نوفا للتجارة','Nova Trading Co.'),area:140,loc:B('المعادي، القاهرة','Maadi, Cairo'),progress:92,fee:{type:'pct',v:10},showFee:true,team:['youssef','karim','noha'],
        items:[['gypsum',90000],['electrical',110000],['tiles',150000],['carpentry',170000],['paint',95000],['ac',65000]]},
    ],
    tx:[
      {kind:'pay',date:day(60),project:'p1',amount:300000,acc:'bank',note:B('دفعة التعاقد','Contract payment')},
      {kind:'pay',date:day(30),project:'p1',amount:250000,acc:'bank',note:B('الدفعة الثانية','Second payment')},
      {kind:'pay',date:day(5),project:'p1',amount:150000,acc:'wallet',note:B('الدفعة الثالثة — إنستاباي','Third payment — InstaPay')},
      {kind:'pay',date:day(40),project:'p2',amount:500000,acc:'bank',note:B('دفعة التعاقد','Contract payment')},
      {kind:'pay',date:day(95),project:'p3',amount:450000,acc:'bank',note:B('دفعة التعاقد','Contract payment')},
      {kind:'pay',date:day(45),project:'p3',amount:150000,acc:'bank',note:B('الدفعة الثانية','Second payment')},
      {kind:'give',date:day(58),eng:'karim',amount:80000,acc:'cash'},
      {kind:'give',date:day(35),eng:'karim',amount:100000,acc:'bank'},
      {kind:'give',date:day(12),eng:'karim',amount:60000,acc:'cash'},
      {kind:'give',date:day(38),eng:'youssef',amount:70000,acc:'cash'},
      {kind:'give',date:day(20),eng:'youssef',amount:80000,acc:'bank'},
      {kind:'exp',date:day(55),project:'p1',item:'masonry',amount:58000,by:'karim',status:'approved',receipt:'sample',vendor:B('مصنع طوب العبور','Obour Brick Works'),note:B('طوب ومونة ومصنعية المباني','Bricks, mortar and masonry labour')},
      {kind:'exp',date:day(50),project:'p1',item:'plumbing',amount:79500,acc:'bank',status:'approved',receipt:'sample',vendor:B('بي آر للمواسير','BR Pipes'),note:B('مواسير ومحابس ومصنعية تأسيس','Pipes, valves and rough-in labour')},
      {kind:'exp',date:day(45),project:'p1',item:'electrical',amount:64000,acc:'bank',status:'approved',receipt:'sample',vendor:B('كابلات السويدي','El Sewedy Cables'),note:B('كابلات ولوحة توزيع','Cables and distribution board')},
      {kind:'exp',date:day(40),project:'p1',item:'electrical',amount:38300,by:'karim',status:'approved',receipt:'sample',vendor:B('المعلم سيد الكهربائي','Sayed, electrician'),note:B('مصنعية تأسيس الكهرباء','Electrical rough-in labour')},
      {kind:'exp',date:day(28),project:'p1',item:'plaster',amount:64000,by:'karim',status:'approved',receipt:'sample',vendor:B('توريدات النصر','El Nasr Supplies'),note:B('رمل وأسمنت ومصنعية المحارة','Sand, cement and plastering labour')},
      {kind:'exp',date:day(10),project:'p1',item:'tiles',amount:96000,acc:'bank',status:'approved',receipt:'sample',vendor:B('معرض كليوباترا','Cleopatra showroom'),note:B('بورسلين الريسبشن 60×120','Reception porcelain 60×120')},
      {kind:'exp',date:day(8),project:'p1',item:'gypsum',amount:21000,by:'karim',status:'approved',receipt:'sample',vendor:B('كناوف مصر','Knauf Egypt'),note:B('ألواح جبس بورد وقطاعات','Gypsum boards and profiles')},
      {kind:'exp',date:day(6),project:'p1',item:'tiles',amount:55000,acc:'wallet',status:'approved',receipt:'sample',vendor:B('معرض كليوباترا','Cleopatra showroom'),note:B('سيراميك الحمامات والمطبخ','Bathroom and kitchen ceramics')},
      {kind:'exp',date:day(1),project:'p1',item:'paint',amount:18500,by:'karim',status:'pending',receipt:'sample',vendor:B('جوتن — موزع التجمع','Jotun — New Cairo dealer'),note:B('دفعة أولى خامات دهانات','First batch of paint materials')},
      {kind:'exp',date:day(0),project:'p1',item:'electrical',amount:7800,by:'karim',status:'pending',receipt:'sample',vendor:B('محل النور للإضاءة','El Nour Lighting'),note:B('كشافات LED للريسبشن','LED downlights for the reception')},
      {kind:'exp',date:day(36),project:'p2',item:'masonry',amount:120000,acc:'bank',status:'approved',receipt:'sample',vendor:B('مصنع طوب العبور','Obour Brick Works'),note:B('طوب أحمر وأسمنت','Red bricks and cement')},
      {kind:'exp',date:day(30),project:'p2',item:'masonry',amount:85000,by:'youssef',status:'approved',receipt:'sample',vendor:B('مقاول المباني','Masonry contractor'),note:B('مصنعية مباني الدور الأرضي','Ground floor masonry labour')},
      {kind:'exp',date:day(18),project:'p2',item:'plumbing',amount:96000,acc:'bank',status:'approved',receipt:'sample',vendor:B('بي آر للمواسير','BR Pipes'),note:B('تأسيس سباكة الدور الأرضي','Ground floor plumbing rough-in')},
      {kind:'exp',date:day(15),project:'p2',item:'electrical',amount:52000,by:'youssef',status:'approved',receipt:'sample',vendor:B('كابلات السويدي','El Sewedy Cables'),note:B('خراطيم وعلب وأسلاك','Conduits, boxes and wire')},
      {kind:'exp',date:day(9),project:'p2',item:'electrical',amount:22000,acc:'wallet',status:'approved',receipt:'sample',vendor:B('المعلم سيد الكهربائي','Sayed, electrician'),note:B('مصنعية تأسيس الكهرباء','Electrical rough-in labour')},
      {kind:'exp',date:day(2),project:'p2',item:'plaster',amount:23400,by:'youssef',status:'pending',receipt:'sample',vendor:B('توريدات النصر','El Nasr Supplies'),note:B('رمل وأسمنت للمحارة','Sand and cement for plastering')},
      {kind:'exp',date:day(80),project:'p3',item:'gypsum',amount:85000,acc:'bank',status:'approved',receipt:'sample',vendor:B('كناوف مصر','Knauf Egypt'),note:B('أسقف جبس بورد معلقة','Suspended gypsum ceilings')},
      {kind:'exp',date:day(70),project:'p3',item:'electrical',amount:118000,acc:'bank',status:'approved',receipt:'sample',vendor:B('كابلات السويدي','El Sewedy Cables'),note:B('كهرباء وشبكات وإضاءة','Power, data and lighting')},
      {kind:'exp',date:day(60),project:'p3',item:'tiles',amount:140000,acc:'bank',status:'approved',receipt:'sample',vendor:B('معرض كليوباترا','Cleopatra showroom'),note:B('بورسلين المكاتب والممرات','Office and corridor porcelain')},
      {kind:'exp',date:day(30),project:'p3',item:'carpentry',amount:165000,acc:'bank',status:'approved',receipt:'sample',vendor:B('ورشة الأمانة للنجارة','El Amana Joinery'),note:B('أبواب ومكاتب خشبية','Doors and timber desks')},
      {kind:'exp',date:day(20),project:'p3',item:'paint',amount:96000,acc:'bank',status:'approved',receipt:'sample',vendor:B('جوتن — موزع المعادي','Jotun — Maadi dealer'),note:B('دهانات نهائية','Final paint coats')},
      {kind:'exp',date:day(14),project:'p3',item:'ac',amount:62000,acc:'bank',status:'approved',receipt:'sample',vendor:B('شارب للتكييف','Sharp AC'),note:B('تكييف غرفة الاجتماعات','Meeting room air conditioning')},
      {kind:'exp',date:day(0),project:'p3',item:'carpentry',amount:4200,by:'karim',status:'pending',receipt:'sample',vendor:B('محل الأمل للإكسسوار','El Amal Hardware'),note:B('مقابض أبواب','Door handles')},
    ],
    tasks:[
      {project:'p1',type:'task',title:B('توريد بورسلين المطبخ','Deliver kitchen porcelain'),who:'karim',due:day(2),status:'todo'},
      {project:'p1',type:'task',title:B('تأسيس تكييفات الريسبشن','AC rough-in for the reception'),who:'karim',due:day(-4),status:'doing'},
      {project:'p1',type:'task',title:B('اعتماد عينة الرخام مع العميل','Approve marble sample with client'),who:'noha',due:day(-6),status:'todo'},
      {project:'p1',type:'snag',title:B('ميول أرضية الحمام الرئيسي','Master bathroom floor slope'),who:'karim',due:day(-2),status:'todo'},
      {project:'p1',type:'task',title:B('استلام أعمال السباكة مع العميل','Plumbing handover with client'),who:'karim',due:day(20),status:'done'},
      {project:'p2',type:'task',title:B('صب سقف الملحق','Pour the annex roof slab'),who:'youssef',due:day(-3),status:'doing'},
      {project:'p2',type:'task',title:B('اعتماد مخطط الكهرباء للدور الأول','Approve first floor electrical plan'),who:'noha',due:day(1),status:'todo'},
      {project:'p3',type:'snag',title:B('تسريب بسيط في تكييف غرفة الاجتماعات','Small leak in meeting room AC'),who:'youssef',due:day(-1),status:'doing'},
      {project:'p3',type:'snag',title:B('تعديل لون باب الإدارة','Repaint the manager\'s door'),who:'karim',due:day(-3),status:'todo'},
      {project:'p3',type:'task',title:B('تنظيف نهائي قبل التسليم','Final clean before handover'),who:'youssef',due:day(-5),status:'todo'},
      {project:'p3',type:'task',title:B('إعداد تقرير التسليم','Prepare the handover report'),who:'noha',due:day(-5),status:'todo'},
    ],
    updates:[
      {project:'p1',by:'karim',date:day(0),progress:62,note:B('تم الانتهاء من محارة الريسبشن وبدء تركيب الجبس بورد','Reception plastering finished, gypsum board installation started')},
      {project:'p3',by:'youssef',date:day(1),progress:92,note:B('تركيب الأبواب والإكسسوارات، ومتبقي ملاحظات الاستلام','Doors and hardware installed, handover snags remaining')},
      {project:'p2',by:'youssef',date:day(2),progress:28,note:B('انتهاء مباني الدور الأرضي وبدء تأسيس الكهرباء','Ground floor masonry done, electrical rough-in started')},
      {project:'p1',by:'karim',date:day(6),progress:55,note:B('توريد البورسلين وبدء التركيب في المطبخ','Porcelain delivered, kitchen installation started')},
    ],
  };
  d.tx.forEach((t,i)=>t.id='t'+i);d.tasks.forEach((t,i)=>t.id='k'+i);
  return d;
}
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
function loadDemo(){try{const s=store.get(DEMO_KEY);if(s){const d=JSON.parse(s);if(d&&d.projects){d.tx.forEach((t,i)=>{if(!t.id)t.id='t'+i});d.tasks.forEach((t,i)=>{if(!t.id)t.id='k'+i});return d}}}catch(e){}return seed()}
function saveDemo(){if(S.mode==='demo')store.set(DEMO_KEY,JSON.stringify(D))}
const pref=(k,v)=>v===undefined?store.get('gindi-studio-'+k):store.set('gindi-studio-'+k,v);

// ---------- state ----------
const DEMO_ME={manager:'mgr',office:'noha',site:'karim',client:'hisham'};
let ME={...DEMO_ME};
let D=null;
const S={lang:pref('lang')||'ar',role:pref('role')||'manager',view:null,pid:null,ptab:'overview',taskF:'open',mode:'boot',authScreen:'signin',authMsg:'',busy:false};
const LV={user:null,profile:null,company:null,offline:false};
const ROLE_TABS={manager:['home','projects','approvals','custody','treasury'],office:['home','projects','tasks','approvals'],site:['site','tasks','projects'],client:['client','statement']};
const live=()=>S.mode==='live';

// ---------- helpers ----------
const t=(k,vars)=>{let s=(L[k]||[k,k])[S.lang==='ar'?0:1];if(vars)for(const v in vars)s=s.split('{'+v+'}').join(vars[v]);return s};
const tx=v=>v==null?'':typeof v==='string'?v:(v[S.lang]||v.ar);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const X=v=>esc(tx(v));
const nf=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
const n=v=>`<span class="num">${nf.format(Math.round(v))}</span>`;
const money=v=>`${n(v)}<span class="cur">${t('egp')}</span>`;
const plain=v=>`${nf.format(Math.round(v))} ${t('egp')}`;
const itemName=k=>ITEMS[k]?ITEMS[k][S.lang==='ar'?0:1]:k;
const person=id=>D.people[id]?(tx(D.people[id].name)||'—'):'—';
const initial=id=>{const nm=tx(D.people[id]?.name||'');const parts=nm.replace(/^(م\.|أ\.|د\.|Eng\.|Mr\.|Dr\.)\s*/,'').split(' ');return (parts[0]||'?').slice(0,1)||'?'};
const accName=id=>{const a=D.accounts.find(x=>x.id===id);return a&&a.name?a.name:(['bank','cash','wallet'].includes(id)?t('acc_'+id):'—')};
const P=id=>D.projects.find(p=>p.id===id);
const todayISO=()=>new Date().toISOString().slice(0,10);
function fdate(iso){if(!iso)return '—';if(iso===todayISO())return t('today');if(iso===day(1))return t('yesterday');const d=new Date(iso+'T00:00:00');return d.toLocaleDateString(S.lang==='ar'?'ar-EG-u-nu-latn':'en-GB',{day:'numeric',month:'short'})}
const exps=(f={})=>D.tx.filter(x=>x.kind==='exp'&&(!f.project||x.project===f.project)&&(!f.status||x.status===f.status)&&(!f.by||x.by===f.by));
const sum=a=>a.reduce((s,x)=>s+x.amount,0);
const spent=p=>sum(exps({project:p.id,status:'approved'}));
const pendingP=p=>sum(exps({project:p.id,status:'pending'}));
const paidP=p=>sum(D.tx.filter(x=>x.kind==='pay'&&x.project===p.id));
const feeP=p=>p.fee.type==='pct'?spent(p)*p.fee.v/100:p.fee.v*p.progress/100;
const balP=p=>paidP(p)-spent(p)-feeP(p);
const itemSpent=(p,k,st='approved')=>sum(exps({project:p.id,status:st}).filter(x=>x.item===k));
const budgetP=p=>p.items.reduce((s,i)=>s+i[1],0);
// Project items plus any item used in an expense that isn't in the list yet (budget 0).
const allItems=p=>{const ks=new Set(p.items.map(i=>i[0]));const extra=[...new Set(exps({project:p.id}).filter(x=>x.status!=='rejected'&&x.item&&!ks.has(x.item)).map(x=>x.item))];return p.items.concat(extra.map(k=>[k,0]))};
// A typed item name becomes a standard key when it matches one, otherwise the name itself is the key.
function itemKey(name){const s=(name||'').trim().replace(/\s+/g,' ');if(!s)return '';const hit=Object.keys(ITEMS).find(k=>k===s||ITEMS[k][0]===s||ITEMS[k][1].toLowerCase()===s.toLowerCase());return hit||s.slice(0,60)}
function collectItems(fd){
  const out=[];Object.keys(ITEMS).forEach(k=>{const b=+fd.get('b_'+k);if(b>0)out.push([k,b])});
  const names=fd.getAll('cn'),bs=fd.getAll('cb');
  names.forEach((nm,i)=>{const k=itemKey(nm);if(!k||out.some(o=>o[0]===k))return;out.push([k,Math.max(0,+bs[i]||0)])});
  return out;
}
function engStats(id){
  const give=sum(D.tx.filter(x=>x.kind==='give'&&x.eng===id));
  const xin=sum(D.tx.filter(x=>x.kind==='xfer'&&x.to===id)), xout=sum(D.tx.filter(x=>x.kind==='xfer'&&x.from===id));
  const ret=sum(D.tx.filter(x=>x.kind==='ret'&&x.eng===id));
  const sp=sum(exps({by:id,status:'approved'})), pend=sum(exps({by:id,status:'pending'}));
  const bal=give+xin-xout-ret-sp;
  return {given:give+xin-xout,ret,spent:sp,pend,bal,after:bal-pend};
}
function accBal(a){
  let b=a.open;
  D.tx.forEach(x=>{
    if(x.acc!==a.id)return;
    if(x.kind==='pay'||x.kind==='ret')b+=x.amount;
    if(x.kind==='give')b-=x.amount;
    if(x.kind==='exp'&&x.status==='approved')b-=x.amount;
  });
  return b;
}
const byRole=r=>Object.keys(D.people).filter(k=>D.people[k].role===r);
const siteEngs=()=>byRole('site');
const staff=()=>Object.keys(D.people).filter(k=>['site','office','manager'].includes(D.people[k].role));
const isLate=k=>k.status!=='done'&&k.due&&k.due<todayISO();
const pctClass=(s,b)=>s>b?'bad':s>=b*.85?'warn':'ok';
const myProjects=()=>S.role==='site'?D.projects.filter(p=>p.team.includes(ME.site)):D.projects;
function clientProject(){return live()?D.projects[0]:(D.projects.find(p=>p.clientId===ME.client)||D.projects[0])}

function alerts(){
  const out=[];
  if(live()&&S.role==='manager'){const r=byRole('pending');if(r.length)out.push({lvl:'info',t:t('a_requests',{n:r.length}),m:t('a_requestsM'),go:{view:'account'}})}
  const pend=exps({status:'pending'});
  if(pend.length&&S.role!=='site')out.push({lvl:'info',t:t('a_pending',{n:pend.length}),m:t('a_pendingM',{v:plain(sum(pend))}),go:{view:'approvals'}});
  D.projects.forEach(p=>{
    if(paidP(p)+spent(p)>0&&balP(p)<0)out.push({lvl:'bad',t:t('a_owes',{v:plain(-balP(p))}),m:t('a_owesM',{p:tx(p.name)}),go:{view:'project',pid:p.id,ptab:'statement'}});
    p.items.forEach(([k,b])=>{const s=itemSpent(p,k);if(b>0&&s>b)out.push({lvl:'warn',t:t('a_over',{i:itemName(k)}),m:t('a_overM',{p:tx(p.name),s:plain(s),b:plain(b)}),go:{view:'project',pid:p.id,ptab:'budget'}})});
  });
  if(S.role==='manager')siteEngs().forEach(e=>{const s=engStats(e);if(s.after<0)out.push({lvl:'warn',t:t('a_short',{e:person(e)}),m:t('a_shortM',{v:plain(-s.after)}),go:{view:'custody'}})});
  const late=D.tasks.filter(isLate).sort((a,b)=>a.due<b.due?-1:1);
  if(late.length)out.push({lvl:'warn',t:t('a_late',{n:late.length}),m:t('a_lateM',{t:tx(late[0].title)}),go:{view:'tasks',taskF:'open'}});
  return out;
}

// ---------- live data ----------
function mapLive(r){
  const people={};r.people.forEach(p=>people[p.id]={name:p.full_name||'—',role:p.role,phone:p.phone||''});
  const projects=r.projects.map(p=>{const mem=r.members.filter(m=>m.project_id===p.id).map(m=>m.user_id);
    return {id:p.id,name:p.name,client:p.client_name||'',loc:p.location||'',area:+p.area||0,progress:p.progress,fee:{type:p.fee_type,v:+p.fee_value},showFee:p.show_fee,
      items:(Array.isArray(p.items)?p.items:[]).map(i=>[i.k,+i.b||0]),team:mem.filter(id=>people[id]&&people[id].role!=='client'),clients:mem.filter(id=>people[id]&&people[id].role==='client')}});
  const txs=r.tx.map(x=>{const o={id:x.id,kind:x.kind,date:x.tx_date,project:x.project_id,item:x.item,amount:+x.amount,status:x.status,vendor:x.vendor||'',note:x.note||'',receipt:x.receipt_path?'path:'+x.receipt_path:null};
    if(x.kind==='exp'){if(x.engineer_id)o.by=x.engineer_id;else o.acc=x.account_id}
    if(x.kind==='give'||x.kind==='ret'){o.eng=x.engineer_id;o.acc=x.account_id}
    if(x.kind==='xfer'){o.from=x.engineer_id;o.to=x.to_engineer_id}
    if(x.kind==='pay')o.acc=x.account_id;
    return o});
  return {people,projects,
    accounts:r.accounts.map(a=>({id:a.id,type:a.type,open:+a.opening,name:a.name})),
    tx:txs,
    tasks:r.tasks.map(k=>({id:k.id,project:k.project_id,type:k.type,title:k.title,who:k.assignee_id,due:k.due,status:k.status})),
    updates:r.updates.map(u=>({project:u.project_id,by:u.author_id,date:(u.created_at||'').slice(0,10),progress:u.progress,note:u.note}))};
}
async function q(table,order){let qq=sb.from(table).select('*');if(order)qq=qq.order(order.col,{ascending:!!order.asc});if(order&&order.limit)qq=qq.limit(order.limit);const {data,error}=await qq;if(error)throw error;return data||[]}
async function loadLive(){
  const uid=LV.user.id;
  const {data:prof,error:pe}=await sb.from('profiles').select('*').eq('id',uid).maybeSingle();if(pe)throw pe;
  LV.profile=prof;
  if(!prof||!prof.company_id){LV.company=null;S.mode='auth';S.authScreen='onboard';return}
  const {data:co,error:ce}=await sb.from('companies').select('*').eq('id',prof.company_id).maybeSingle();if(ce)throw ce;
  LV.company=co;
  if(prof.role==='pending'){S.mode='auth';S.authScreen='pending';return}
  const [people,accounts,projects,members,txr,tasks,updates]=await Promise.all([
    q('profiles'),prof.role==='manager'?q('accounts',{col:'created_at',asc:true}):Promise.resolve([]),q('projects',{col:'created_at',asc:true}),q('project_members'),
    q('transactions',{col:'tx_date',asc:true}),q('tasks',{col:'created_at',asc:true}),q('updates',{col:'created_at',asc:false,limit:300})]);
  D=mapLive({people,accounts,projects,members,tx:txr,tasks,updates});
  S.mode='live';S.role=prof.role;ME={manager:uid,office:uid,site:uid,client:uid};LV.offline=false;
  store.set(CACHE_KEY,JSON.stringify({uid,profile:prof,company:co,D}));
}
let reloadT=null,reloadWaiting=false;
async function refresh(silent){
  try{await loadLive()}
  catch(e){
    const c=(()=>{try{return JSON.parse(store.get(CACHE_KEY)||'null')}catch(_){return null}})();
    if(c&&LV.user&&c.uid===LV.user.id){D=c.D;LV.profile=c.profile;LV.company=c.company;S.mode='live';S.role=c.profile.role;ME={manager:c.uid,office:c.uid,site:c.uid,client:c.uid};LV.offline=true}
    else if(!silent){S.mode='auth';S.authScreen='signin';S.authMsg=errMsg(e)}
  }
  render();
}
function scheduleReload(){clearTimeout(reloadT);reloadT=setTimeout(()=>{if($('modal').innerHTML){reloadWaiting=true;return}refresh(true)},700)}
let channel=null;
function subscribe(){
  if(!sb||channel)return;
  channel=sb.channel('gindi-db');
  ['transactions','tasks','updates','projects','profiles'].forEach(tb=>channel.on('postgres_changes',{event:'*',schema:'public',table:tb},scheduleReload));
  channel.subscribe();
}
function unsubscribe(){if(channel){sb.removeChannel(channel);channel=null}}
function errMsg(e){
  const m=(e&&(e.message||e.error_description||String(e)))||'';
  if(/Failed to fetch|NetworkError|network/i.test(m))return t('netErr');
  if(/Invalid login credentials/i.test(m))return t('err_login');
  if(/already registered|already been registered|User already/i.test(m))return t('err_exists');
  if(/Email not confirmed/i.test(m))return t('err_confirm');
  if(/invalid code/i.test(m))return t('err_code');
  if(/row-level security|permission denied|manager only|not allowed/i.test(m))return t('err_denied');
  if(/Password should be/i.test(m))return t('passShort');
  return t('err_generic',{m});
}
async function must(p){const r=await p;if(r&&r.error)throw r.error;return r?r.data:null}

// ---------- render ----------
const $=id=>document.getElementById(id);
function go(o){Object.assign(S,o);render();window.scrollTo({top:0});}
function render(){
  document.documentElement.lang=S.lang;document.documentElement.dir=S.lang==='ar'?'rtl':'ltr';
  if(S.mode==='boot'){$('top').innerHTML=brand();$('main').innerHTML=`<div class="empty">${t('wait')}</div>`;$('tabs').innerHTML='';$('rail').innerHTML='';return}
  if(S.mode==='auth'){renderAuth();return}
  const tabs=ROLE_TABS[S.role]||ROLE_TABS.client;
  if(!S.view||(!tabs.includes(S.view)&&!['project','account'].includes(S.view)))S.view=tabs[0];
  if(S.view==='project'&&S.role==='client')S.view='client';
  renderTop();renderNav(tabs);
  const V={home:vHome,projects:vProjects,project:vProject,approvals:vApprovals,custody:vCustody,treasury:vTreasury,tasks:vTasks,site:vSite,client:vClient,statement:vClientStatement,account:vAccount};
  $('main').innerHTML=(LV.offline&&live()?`<div class="hint warn">${t('offline')}</div>`:'')+V[S.view]();
}
const brand=()=>`<div class="mark"><b>GINDI STUDIO</b><span>${t('tagline')}</span></div>`;
const langBtn=()=>`<button class="chip-btn" data-act="lang" aria-label="Language">${S.lang==='ar'?'EN':'ع'}</button>`;
function renderTop(){
  if(live()){
    const pend=S.role==='manager'?byRole('pending').length:0;
    $('top').innerHTML=`${brand()}<button class="me-btn" data-act="nav" data-view="account" aria-label="${t('t_account')}"><span class="av">${esc(initial(LV.user.id))}</span><span class="nm">${esc(person(LV.user.id))}</span>${pend?`<span class="dot num">${pend}</span>`:''}</button>${langBtn()}`;
  }else{
    $('top').innerHTML=`${brand()}<span class="pill p-b">${t('demoBadge')}</span>
    <label class="role"><span>${t('viewAs')}</span><select id="roleSel" data-change="role">${['manager','office','site','client'].map(r=>`<option value="${r}"${r===S.role?' selected':''}>${t('r_'+r)}</option>`).join('')}</select></label>${langBtn()}`;
  }
}
function renderNav(tabs){
  const pc=exps({status:'pending'}).length;
  const html=tabs.map(k=>`<button class="tab" data-act="nav" data-view="${k}"${(S.view===k||(S.view==='project'&&k==='projects'))?' aria-current="page"':''}>${IC[k]}<span>${t('t_'+k)}</span>${k==='approvals'&&pc?`<span class="dot num">${pc}</span>`:''}</button>`).join('');
  $('tabs').innerHTML=html;
  const foot=live()?`<div class="foot"><span>${esc(LV.company?.name||'')}</span><button class="btn ghost sm" data-act="nav" data-view="account">${t('t_account')}</button></div>`
    :`<div class="foot"><span>${t('demo')}</span><button class="btn ghost sm" data-act="reset">${t('reset')}</button>${sb?`<button class="btn sm" data-act="leave-demo">${t('signin')}</button>`:''}</div>`;
  $('rail').innerHTML=html+foot;
}
const head=(title,sub,actions='')=>`<div class="head"><div><h1>${title}</h1>${sub?`<p>${sub}</p>`:''}</div>${actions?`<div class="btns">${actions}</div>`:''}</div>`;
const demoNote=()=>live()?'':`<div class="demo-note">${t('demo')} <button class="btn ghost sm" data-act="reset">${t('reset')}</button>${sb?`<button class="btn sm" data-act="leave-demo">${t('signin')}</button>`:''}</div>`;
const statusPill=s=>s==='approved'?`<span class="pill p-ok">${t('approved')}</span>`:s==='rejected'?`<span class="pill p-bad">${t('rejected')}</span>`:`<span class="pill p-warn">${t('pending')}</span>`;
const rcptBtn=x=>`<button class="receipt-btn" data-act="receipt" data-id="${x.id}" aria-label="${t('receipt')}">${x.receipt&&x.receipt.startsWith('data:')?`<img src="${x.receipt}" alt="">`:IC.receipt}</button>`;
const greet=()=>`${t('hello')}${S.lang==='ar'?'، ':', '}${esc(person(ME[S.role]))}`;

function alertList(){
  const a=alerts();
  if(!a.length)return `<div class="panel empty">${t('allGood')}</div>`;
  return `<div class="panel rows">${a.map((x,i)=>`<button class="alert ${x.lvl==='bad'?'bad':x.lvl==='info'?'info':''}" data-act="alert" data-i="${i}"><div><div class="t">${esc(x.t)}</div><div class="m">${esc(x.m)}</div></div></button>`).join('')}</div>`;
}
function projCard(p){
  const s=spent(p),b=budgetP(p),bal=balP(p);
  const over=p.items.filter(([k,bb])=>bb>0&&itemSpent(p,k)>bb).length;
  const open=D.tasks.filter(k=>k.project===p.id&&k.status!=='done'&&k.type==='snag').length;
  return `<button class="pcard" data-act="open" data-id="${p.id}">
    <div><h3>${X(p.name)}</h3><div class="meta">${X(p.client)||'—'}${p.area?` · ${n(p.area)} ${t('m2')}`:''}</div></div>
    <div class="split"><span>${t('progress')}</span><b class="num">${p.progress}%</b></div>
    <div class="bar"><i style="width:${p.progress}%"></i></div>
    <div class="split"><span>${t('spent')} <b>${money(s)}</b></span><span>${t('budget')} <b>${money(b)}</b></span></div>
    <div class="chips">${bal<0?`<span class="pill p-bad">${t('a_owes',{v:plain(-bal)})}</span>`:`<span class="pill p-ok">${t('balance')}: ${plain(bal)}</span>`}${over?`<span class="pill p-warn">${t('over')}: ${over}</span>`:''}${open?`<span class="pill p-n">${t('snag')}: ${open}</span>`:''}</div>
  </button>`;
}
function feedList(list){
  if(!list.length)return `<div class="panel empty">—</div>`;
  return `<div class="panel feed rows">${list.map(u=>`<div class="fi"><div class="av">${esc(initial(u.by))}</div><div class="grow"><div>${X(u.note)||'—'}</div><div class="m">${esc(person(u.by))} · ${P(u.project)?X(P(u.project).name):''} · ${fdate(u.date)} · <span class="num">${u.progress}%</span></div></div></div>`).join('')}</div>`;
}
const noProjects=()=>`<div class="panel empty"><p>${S.role==='manager'?t('noProjects'):t('noAssigned')}</p>${S.role==='manager'?`<button class="btn" data-act="m-project">${IC.plus}${t('firstProject')}</button>`:''}</div>`;

function vHome(){
  const pend=exps({status:'pending'});
  const totT=D.accounts.reduce((s,a)=>s+accBal(a),0);
  const cust=siteEngs().reduce((s,e)=>s+engStats(e).bal,0);
  const mgr=S.role==='manager';
  return `${head(greet(),live()?esc(LV.company?.name||''):t('homeSub'),(mgr?`<button class="btn" data-act="m-pay">${IC.plus}${t('recordPay')}</button>`:`<button class="btn" data-act="m-task">${IC.plus}${t('addTask')}</button>`)+`<button class="btn ghost" data-act="m-export">${IC.download}${t('exportX')}</button>`)}
  <div class="kpis">
    ${mgr?`<div class="kpi"><span class="l">${t('k_treasury')}</span><span class="v">${money(totT)}</span><span class="s">${t('across',{n:D.accounts.length})}</span></div>`:''}
    <div class="kpi${pend.length?' warn':''}"><span class="l">${t('k_pending')}</span><span class="v">${money(sum(pend))}</span><span class="s">${t('items_n',{n:pend.length})}</span></div>
    ${mgr?`<div class="kpi"><span class="l">${t('k_custody')}</span><span class="v">${money(cust)}</span><span class="s">${t('engs_n',{n:siteEngs().length})}</span></div>`:''}
    <div class="kpi"><span class="l">${t('k_active')}</span><span class="v num">${D.projects.length}</span><span class="s">${t('projSub',{n:D.projects.length})}</span></div>
    ${!mgr?`<div class="kpi"><span class="l">${t('late')}</span><span class="v num">${D.tasks.filter(isLate).length}</span><span class="s">${t('t_tasks')}</span></div>`:''}
  </div>
  <section class="sec"><h2>${t('attention')}</h2>${alertList()}</section>
  <section class="sec"><h2>${t('t_projects')}${mgr&&D.projects.length?`<button class="btn ghost sm" data-act="m-project">${IC.plus}${t('newProject')}</button>`:''}</h2>${D.projects.length?`<div class="grid three">${D.projects.map(projCard).join('')}</div>`:noProjects()}</section>
  <section class="sec"><h2>${t('recent')}</h2>${feedList(D.updates.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,4))}</section>
  ${demoNote()}`;
}
function vProjects(){
  const list=myProjects();
  return `${head(t('t_projects'),t('projSub',{n:list.length}),(S.role==='manager'?`<button class="btn" data-act="m-project">${IC.plus}${t('newProject')}</button>`:'')+(['manager','office'].includes(S.role)&&list.length?`<button class="btn ghost" data-act="m-export">${IC.download}${t('exportX')}</button>`:''))}${list.length?`<div class="grid three">${list.map(projCard).join('')}</div>`:noProjects()}`;
}
function vProject(){
  const p=P(S.pid);if(!p){S.view='projects';return vProjects()}
  const tabs=['overview','budget','tasks','statement'];
  return `<div><button class="back" data-act="nav" data-view="projects">${t('backTo')}</button></div>
  ${head(X(p.name),[X(p.client),X(p.loc),p.area?`${n(p.area)} ${t('m2')}`:''].filter(Boolean).join(' · '),(['site','office','manager'].includes(S.role)?`<button class="btn ghost" data-act="m-prog" data-id="${p.id}">${IC.up}${t('updProg')}</button>`:'')+(['manager','office'].includes(S.role)?`<button class="btn ghost" data-act="m-export" data-id="${p.id}">${IC.download}${t('exportX')}</button>`:''))}
  <div class="seg" role="group">${tabs.map(k=>`<button data-act="ptab" data-tab="${k}" aria-pressed="${S.ptab===k}">${t('pt_'+k)}</button>`).join('')}</div>
  ${({overview:pOverview,budget:pBudget,tasks:pTasks,statement:pStatement})[S.ptab](p)}`;
}
function balGrid(p,forClient){
  const showFee=!forClient||p.showFee;
  const balOut=forClient&&!p.showFee?paidP(p)-spent(p):balP(p);
  return `<div class="bal">
    <div><span class="l">${t('paid')}</span><span class="v">${money(paidP(p))}</span></div>
    <div><span class="l">${t('spent')}</span><span class="v">${money(spent(p))}</span></div>
    ${showFee?`<div><span class="l">${t('fee')}</span><span class="v">${money(feeP(p))}</span></div>`:''}
    <div><span class="l">${forClient?(balOut<0?t('dueNow'):t('credit_left')):t('balance')}</span><span class="v ${balOut<0?'neg':'pos'}">${money(Math.abs(balOut))}</span></div>
  </div>`;
}
function pOverview(p){
  const mgr=S.role==='manager';
  const teamRows=p.team.map(id=>`<div class="row"><div class="fi" style="padding:0"><div class="av">${esc(initial(id))}</div></div><div class="grow"><div class="t">${esc(person(id))}</div><div class="m">${t('r_'+(D.people[id]?.role||'site'))}</div></div></div>`).join('');
  return `<div class="grid two">
    <section class="sec"><h2>${t('progress')} <span class="num">${p.progress}%</span></h2><div class="bar" style="height:12px"><i style="width:${p.progress}%"></i></div>
      ${balGrid(p,false)}
    </section>
    <section class="sec"><h2>${t('team')}${mgr&&live()?`<button class="btn ghost sm" data-act="nav" data-view="account">${t('members')}</button>`:''}</h2><div class="panel rows">${teamRows}<div class="row"><div class="grow"><div class="t">${X(p.client)||'—'}</div><div class="m">${t('client')}</div></div></div></div></section>
  </div>
  <section class="sec"><h2>${t('feeModel')}</h2>
    ${mgr?`<form class="panel" style="padding:14px" data-form="fee" data-id="${p.id}">
      <div class="f2"><div class="f"><label for="feeType">${t('feeModel')}</label><select id="feeType" name="type"><option value="pct"${p.fee.type==='pct'?' selected':''}>${t('fee_pct')}</option><option value="fixed"${p.fee.type==='fixed'?' selected':''}>${t('fee_fixed')}</option></select></div>
      <div class="f"><label for="feeV">${t('feeVal')}</label><input id="feeV" name="v" type="number" min="0" step="any" inputmode="decimal" value="${p.fee.v}"></div></div>
      <label class="check"><input type="checkbox" name="show"${p.showFee?' checked':''}> ${t('showFee')}</label>
      <div><button class="btn sm">${t('save')}</button></div></form>`
    :`<div class="panel row"><div class="grow">${p.fee.type==='pct'?t('feeExplainPct',{v:p.fee.v}):t('feeExplainFixed',{v:plain(p.fee.v)})}</div><b>${money(feeP(p))}</b></div>`}
  </section>
  <section class="sec"><h2>${t('recent')}</h2>${feedList(D.updates.filter(u=>u.project===p.id).sort((a,b)=>a.date<b.date?1:-1))}</section>`;
}
function pBudget(p){
  const tb=budgetP(p);
  return `<div class="bal" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><span class="l">${t('budgetTotal')}</span><span class="v">${money(tb)}</span></div><div><span class="l">${t('spent')}</span><span class="v">${money(spent(p))}</span></div><div><span class="l">${t('pendingShort')}</span><span class="v">${money(pendingP(p))}</span></div></div>
  <div class="head"><p class="demo-note" style="margin:0">${t('legend')}</p>${S.role==='manager'?`<button class="btn ghost sm" data-act="m-items" data-id="${p.id}">${t('editItems')}</button>`:''}</div>
  ${allItems(p).length?`<div class="panel rows">${allItems(p).map(([k,b])=>{const s=itemSpent(p,k),pe=itemSpent(p,k,'pending'),c=b>0?pctClass(s,b):'ok',w=b>0?Math.min(100,s/b*100):0,pw=b>0?Math.max(0,Math.min(100-w,pe/b*100)):0;
    return `<div class="item"><div class="top2"><b>${esc(itemName(k))}</b><span>${b<=0?`<span class="pill p-n">${t('noBudget')}</span>`:c==='bad'?`<span class="pill p-bad">${t('over')} ${plain(s-b)}</span>`:c==='warn'?`<span class="pill p-warn">${t('near')}</span>`:`<span class="pill p-ok">${t('within')}</span>`}</span></div>
    <div class="bar"><i class="${c}" style="width:${w}%"></i>${pw?`<i class="pend" style="width:${pw}%"></i>`:''}</div>
    <div class="split"><span>${t('spent')} <b>${money(s)}</b>${pe?` · ${t('pendingShort')} <b>${money(pe)}</b>`:''}</span><span>${t('budget')} <b>${money(b)}</b>${b>0?` · <b class="num">${Math.round(s/b*100)}%</b>`:''}</span></div></div>`}).join('')}</div>`:''}
  <section class="sec"><h2>${t('history')}</h2>${expList(exps({project:p.id}).sort((a,b)=>a.date<b.date?1:-1),false)}</section>`;
}
function expList(list,withActions){
  if(!list.length)return `<div class="panel empty">${t('noPending')}</div>`;
  return `<div class="panel rows">${list.map(x=>{const p=P(x.project);
    let extra='';
    if(withActions&&p){const ib=(p.items.find(i=>i[0]===x.item)||[0,0])[1];const willOver=ib>0&&itemSpent(p,x.item)+x.amount>ib;
      extra=`<div class="chips" style="margin-top:6px">${willOver?`<span class="pill p-warn">${t('willOver')}</span>`:''}${x.by&&S.role==='manager'?`<span class="pill p-n">${t('custAfter',{v:plain(engStats(x.by).bal-x.amount)})}</span>`:''}</div>`;}
    return `<div class="row" style="align-items:flex-start">${rcptBtn(x)}<div class="grow"><div class="t">${X(x.note)||esc(itemName(x.item))}</div><div class="m">${esc(itemName(x.item))} · ${p?X(p.name):''} · ${fdate(x.date)}</div><div class="m">${x.by?t('fromCustody',{e:person(x.by)}):t('fromAcc',{a:accName(x.acc)})}${x.vendor?' · '+X(x.vendor):''}</div>${extra}
      ${withActions&&S.role==='manager'?`<div class="btns" style="margin-top:8px"><button class="btn ok sm" data-act="approve" data-id="${x.id}">${t('approve')}</button><button class="btn bad sm" data-act="reject" data-id="${x.id}">${t('reject')}</button></div>`:''}</div>
      <div style="text-align:end;display:flex;flex-direction:column;gap:4px;align-items:flex-end"><span class="amt">${money(x.amount)}</span>${statusPill(x.status)}</div></div>`}).join('')}</div>`;
}
function taskRows(list){
  if(!list.length)return `<div class="panel empty">${t('noTasks')}</div>`;
  return `<div class="panel rows">${list.map(k=>{const late=isLate(k);const can=S.role!=='client'&&(S.role!=='site'||k.who===ME.site);
    return `<div class="row"><div class="grow"><div class="t">${X(k.title)}</div><div class="m">${P(k.project)?X(P(k.project).name):''} · ${esc(person(k.who))} · ${t('due')}: ${fdate(k.due)}</div>
      <div class="chips" style="margin-top:4px"><span class="pill ${k.type==='snag'?'p-b':'p-n'}">${t(k.type)}</span>${k.status==='done'?`<span class="pill p-ok">${t('done')}</span>`:late?`<span class="pill p-bad">${t('late')}</span>`:k.status==='doing'?`<span class="pill p-warn">${t('doing')}</span>`:`<span class="pill p-n">${t('todo')}</span>`}</div></div>
      ${can&&k.status!=='done'?`<div class="btns">${k.status==='todo'?`<button class="btn ghost sm" data-act="tstart" data-id="${k.id}">${t('start')}</button>`:''}<button class="btn ok sm" data-act="tdone" data-id="${k.id}">${t('markDone')}</button></div>`:''}</div>`}).join('')}</div>`;
}
const taskSort=(a,b)=>(a.status==='done')-(b.status==='done')||((a.due||'9')<(b.due||'9')?-1:1);
function pTasks(p){
  const list=D.tasks.filter(k=>k.project===p.id).sort(taskSort);
  return `<div class="head"><div></div>${S.role!=='client'?`<button class="btn" data-act="m-task" data-id="${p.id}">${IC.plus}${t('addTask')}</button>`:''}</div>${taskRows(list)}`;
}
function stmtRows(p,forClient){
  const rows=D.tx.filter(x=>x.project===p.id&&(x.kind==='pay'||(x.kind==='exp'&&x.status==='approved'))).sort((a,b)=>a.date<b.date?-1:1);
  let run=0;
  const body=rows.map(x=>{const cr=x.kind==='pay'?x.amount:0,dr=x.kind==='exp'?x.amount:0;run+=cr-dr;
    return `<tr><td>${fdate(x.date)}</td><td>${x.kind==='pay'?`${t('clientPay')}${tx(x.note)?' — '+X(x.note):''}`:`${esc(itemName(x.item))}${tx(x.note)?' — '+X(x.note):''}`}</td><td class="n">${dr?n(dr):''}</td><td class="n">${cr?n(cr):''}</td><td class="n">${n(run)}</td></tr>`}).join('');
  const showFee=!forClient||p.showFee;const fee=feeP(p);
  const feeRow=showFee?`<tr><td>${t('today')}</td><td>${t('feeLine')} (${p.fee.type==='pct'?t('feeExplainPct',{v:p.fee.v}):t('feeExplainFixed',{v:plain(p.fee.v)})})</td><td class="n">${n(fee)}</td><td class="n"></td><td class="n">${n(run-fee)}</td></tr>`:'';
  const endBal=showFee?run-fee:run;
  return `<div class="panel scroll"><table class="stmt"><thead><tr><th>${t('date')}</th><th>${t('desc')}</th><th style="text-align:end">${t('debit')}</th><th style="text-align:end">${t('credit')}</th><th style="text-align:end">${t('runBal')}</th></tr></thead><tbody>${body}${feeRow}</tbody>
  <tfoot><tr><td></td><td>${t('totals')}</td><td class="n">${n(spent(p)+(showFee?fee:0))}</td><td class="n">${n(paidP(p))}</td><td class="n" style="color:var(--${endBal<0?'bad':'ok'})">${n(endBal)}</td></tr></tfoot></table></div>`;
}
function summaryText(p,forClient){
  const withFee=!forClient||p.showFee;
  return t(withFee?'waText':'waTextNoFee',{p:tx(p.name),paid:plain(paidP(p)),spent:plain(spent(p)),fee:plain(feeP(p)),bal:plain(withFee?balP(p):paidP(p)-spent(p)),prog:p.progress});
}
function shareBtns(p,forClient){
  return `<div class="btns"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(summaryText(p,forClient))}" target="_blank" rel="noopener">${IC.share}${t('shareWa')}</a><button class="btn ghost" data-act="copy" data-text="${esc(summaryText(p,forClient))}">${IC.copy}${t('copy')}</button></div>`;
}
function pStatement(p){
  return `${balGrid(p,false)}<div class="head"><h2 style="font-size:16px;font-weight:800">${t('stmtTitle')} — ${X(p.client)||X(p.name)}</h2>${shareBtns(p,false)}</div>${stmtRows(p,false)}`;
}
function vApprovals(){
  const pend=exps({status:'pending'}).sort((a,b)=>a.date<b.date?1:-1);
  const recent=D.tx.filter(x=>x.kind==='exp'&&x.status!=='pending'&&x.by).sort((a,b)=>a.date<b.date?1:-1).slice(0,8);
  return `${head(t('t_approvals'),t('approvalsSub'))}
  ${S.role!=='manager'?`<div class="hint">${t('approvalsRO')}</div>`:''}
  <section class="sec"><h2>${t('k_pending')} <span class="pill p-warn num">${pend.length}</span></h2>${expList(pend,true)}</section>
  <section class="sec"><h2>${t('history')}</h2>${expList(recent,false)}</section>`;
}
function vCustody(){
  const movs=D.tx.filter(x=>['give','xfer','ret'].includes(x.kind)).sort((a,b)=>a.date<b.date?1:-1);
  const engs=siteEngs();
  return `${head(t('t_custody'),t('custodySub'),engs.length?`<button class="btn" data-act="m-give">${IC.plus}${t('giveCustody')}</button>${engs.length>1?`<button class="btn ghost" data-act="m-xfer">${IC.swap}${t('transfer')}</button>`:''}`:'')}
  ${engs.length?`<div class="grid two">${engs.map(e=>{const s=engStats(e);return `<div class="panel" style="padding:14px;display:flex;flex-direction:column;gap:10px">
    <div class="row" style="padding:0"><div class="fi" style="padding:0"><div class="av">${esc(initial(e))}</div></div><div class="grow"><div class="t">${esc(person(e))}</div><div class="m">${t('r_site')}</div></div>${s.after<0?`<span class="pill p-bad">${t('short')}</span>`:''}</div>
    <div class="split"><span>${t('available')}</span><b style="font-size:20px">${money(s.bal)}</b></div>
    <div class="bar">${s.given>0?`<i class="ok" style="width:${Math.max(0,Math.min(100,s.spent/s.given*100))}%"></i><i class="pend" style="width:${Math.max(0,Math.min(100,s.pend/s.given*100))}%"></i>`:''}</div>
    <div class="split"><span>${t('given')} <b>${money(s.given)}</b></span><span>${t('spentApproved')} <b>${money(s.spent)}</b></span></div>
    <div class="split"><span>${t('pendingShort')} <b>${money(s.pend)}</b></span><span>${t('afterPending')} <b style="color:var(--${s.after<0?'bad':'ink'})">${money(s.after)}</b></span></div>
    <div class="btns"><button class="btn ghost sm" data-act="m-give" data-id="${e}">${t('giveCustody')}</button><button class="btn ghost sm" data-act="m-ret" data-id="${e}">${t('settle')}</button></div></div>`}).join('')}</div>`:`<div class="panel empty">${t('noEngineers')}</div>`}
  <section class="sec"><h2>${t('history')}</h2>${movs.length?`<div class="panel rows">${movs.map(x=>`<div class="row"><div class="grow"><div class="t">${t('k_'+x.kind)}</div><div class="m">${x.kind==='xfer'?`${esc(person(x.from))} ${S.lang==='ar'?'←':'→'} ${esc(person(x.to))}`:`${esc(person(x.eng))} · ${esc(accName(x.acc))}`} · ${fdate(x.date)}</div></div><span class="amt">${money(x.amount)}</span></div>`).join('')}</div>`:`<div class="panel empty">${t('noMoves')}</div>`}</section>`;
}
function vTreasury(){
  const tot=D.accounts.reduce((s,a)=>s+accBal(a),0);
  const movs=D.tx.filter(x=>x.acc&&(x.kind!=='exp'||x.status==='approved')).sort((a,b)=>a.date<b.date?1:-1).slice(0,20);
  const sign=x=>x.kind==='pay'||x.kind==='ret'?1:-1;
  const label=x=>x.kind==='pay'?`${t('clientPay')} · ${P(x.project)?X(P(x.project).name):''}`:x.kind==='exp'?`${esc(itemName(x.item))} · ${P(x.project)?X(P(x.project).name):''}`:x.kind==='give'?`${t('k_give')} · ${esc(person(x.eng))}`:`${t('k_ret')} · ${esc(person(x.eng))}`;
  return `${head(t('t_treasury'),t('treasurySub'),`<button class="btn" data-act="m-pay">${IC.plus}${t('recordPay')}</button><button class="btn ghost" data-act="m-exp">${t('directExp')}</button><button class="btn ghost" data-act="m-export">${IC.download}${t('exportX')}</button>`)}
  <div class="hero"><span class="l">${t('totalBal')}</span><span class="big">${money(tot)}</span></div>
  <div class="grid three">${D.accounts.map(a=>`<button class="kpi" style="text-align:start;cursor:${live()?'pointer':'default'}" ${live()?`data-act="m-acc" data-id="${a.id}"`:''}><span class="l">${t('ty_'+a.type)}</span><span class="t" style="font-weight:800">${esc(accName(a.id))}</span><span class="v">${money(accBal(a))}</span></button>`).join('')}</div>
  <section class="sec"><h2>${t('movements')}</h2>${movs.length?`<div class="panel rows">${movs.map(x=>`<div class="row"><div class="grow"><div class="t">${label(x)}</div><div class="m">${esc(accName(x.acc))} · ${fdate(x.date)}</div></div><span class="amt" style="color:var(--${sign(x)>0?'ok':'ink'})">${sign(x)>0?'+':'−'}${money(x.amount)}</span></div>`).join('')}</div>`:`<div class="panel empty">${t('noMoves')}</div>`}</section>`;
}
function vTasks(){
  const F=S.role==='site'?['mine','open','snag','done']:['open','task','snag','done','all'];
  if(!F.includes(S.taskF))S.taskF=F[0];
  let list=D.tasks.slice();
  if(S.role==='site')list=list.filter(k=>P(k.project)&&P(k.project).team.includes(ME.site));
  const f=S.taskF;
  list=list.filter(k=>f==='all'?true:f==='open'?k.status!=='done':f==='done'?k.status==='done':f==='mine'?k.who===ME.site&&k.status!=='done':k.type===f&&k.status!=='done').sort(taskSort);
  return `${head(t('t_tasks'),t('tasksSub'),D.projects.length?`<button class="btn" data-act="m-task">${IC.plus}${t('addTask')}</button>`:'')}
  <div class="seg" role="group">${F.map(k=>`<button data-act="taskF" data-f="${k}" aria-pressed="${S.taskF===k}">${t('f_'+k)}</button>`).join('')}</div>${taskRows(list)}`;
}
function vSite(){
  const me=ME.site,s=engStats(me);
  const mine=exps({by:me}).sort((a,b)=>a.date<b.date?1:-1);
  const tasks=D.tasks.filter(k=>k.who===me&&k.status!=='done').sort(taskSort);
  const has=myProjects().length>0;
  return `${head(greet(),t('siteSub'))}
  <div class="hero"><span class="l">${t('myBal')}</span><span class="big">${money(s.bal)}</span>
    <div class="sub"><span>${t('pendingShort')}: <b>${plain(s.pend)}</b></span><span>${t('afterPending')}: <b>${plain(s.after)}</b></span><span>${t('given')}: <b>${plain(s.given)}</b></span></div>
    ${has?`<div class="btns"><button class="btn" data-act="m-exp">${IC.plus}${t('logExp')}</button><button class="btn ghost" data-act="m-prog">${IC.up}${t('updProg')}</button></div>`:''}</div>
  ${has?'':noProjects()}
  <section class="sec"><h2>${t('myTasks')}</h2>${taskRows(tasks)}</section>
  <section class="sec"><h2>${t('myExp')}<button class="btn ghost sm" data-act="m-export">${IC.download}${t('exportX')}</button></h2>${expList(mine,false)}</section>
  ${demoNote()}`;
}
function vClient(){
  const p=clientProject();
  if(!p)return `${head(t('clientHello',{n:esc(person(ME.client))}),t('clientSub'))}${noProjects()}`;
  const pays=D.tx.filter(x=>x.kind==='pay'&&x.project===p.id).sort((a,b)=>a.date<b.date?1:-1);
  const snags=D.tasks.filter(k=>k.project===p.id&&k.type==='snag'&&k.status!=='done');
  const used=allItems(p).map(([k])=>[k,itemSpent(p,k)]).filter(i=>i[1]>0).sort((a,b)=>b[1]-a[1]);const max=Math.max(...used.map(i=>i[1]),1);
  return `${head(t('clientHello',{n:esc(person(ME.client))}),t('clientSub'))}
  <div class="hero"><span class="l">${X(p.name)}${tx(p.loc)?' · '+X(p.loc):''}</span><span class="big num">${p.progress}%</span>
    <div class="bar" style="background:rgba(255,255,255,.15);border-color:transparent"><i style="width:${p.progress}%;background:var(--hero-gold)"></i></div>
    <div class="btns"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(tx(p.name)+' — ')}" target="_blank" rel="noopener">${t('contactEng')}</a></div></div>
  ${balGrid(p,true)}
  <section class="sec"><h2>${t('recent')}</h2>${feedList(D.updates.filter(u=>u.project===p.id).sort((a,b)=>a.date<b.date?1:-1))}</section>
  <div class="grid two">
  <section class="sec"><h2>${t('whereMoney')}</h2>${used.length?`<div class="panel rows">${used.map(([k,v])=>`<div class="item"><div class="top2"><b>${esc(itemName(k))}</b><span class="amt">${money(v)}</span></div><div class="bar"><i style="width:${v/max*100}%"></i></div></div>`).join('')}</div>`:`<div class="panel empty">—</div>`}</section>
  <section class="sec"><h2>${t('openSnags')}</h2>${snags.length?taskRows(snags):`<div class="panel empty">${t('noSnags')}</div>`}
    <h2 style="font-size:16px;font-weight:800;margin-top:8px">${t('yourPayments')}</h2>${pays.length?`<div class="panel rows">${pays.map(x=>`<div class="row"><div class="grow"><div class="t">${X(x.note)||t('clientPay')}</div><div class="m">${fdate(x.date)}</div></div><span class="amt">${money(x.amount)}</span></div>`).join('')}</div>`:`<div class="panel empty">—</div>`}</section>
  </div>`;
}
function vClientStatement(){
  const p=clientProject();
  if(!p)return `${head(t('stmtTitle'),'')}${noProjects()}`;
  return `${head(t('stmtTitle'),X(p.name),`<button class="btn ghost" data-act="m-export">${IC.download}${t('exportX')}</button>`)}${balGrid(p,true)}<div class="head"><div></div>${shareBtns(p,true)}</div>${stmtRows(p,true)}`;
}

// ---------- account & team (live) ----------
function inviteText(){return t('inviteText',{c:LV.company?.name||'',u:location.origin+location.pathname,k:LV.company?.join_code||''})}
function vAccount(){
  if(!live())return `${head(t('t_account'),t('demo'))}${demoNote()}`;
  const me=LV.user.id,mgr=S.role==='manager';
  const people=Object.keys(D.people);
  const pend=people.filter(id=>D.people[id].role==='pending');
  const members=people.filter(id=>D.people[id].role!=='pending').sort((a,b)=>['manager','office','site','client'].indexOf(D.people[a].role)-['manager','office','site','client'].indexOf(D.people[b].role));
  const projNames=id=>D.projects.filter(p=>p.team.includes(id)||(p.clients||[]).includes(id)).map(p=>tx(p.name)).join('، ');
  const mrow=id=>`<button class="row click" ${mgr&&id!==me?`data-act="m-member" data-id="${id}"`:''} style="cursor:${mgr&&id!==me?'pointer':'default'}"><div class="fi" style="padding:0"><div class="av">${esc(initial(id))}</div></div><div class="grow"><div class="t">${esc(person(id))}${id===me?` <span class="pill p-n">${t('you')}</span>`:''}</div><div class="m">${t('r_'+D.people[id].role)}${projNames(id)?' · '+esc(projNames(id)):''}</div></div>${mgr&&id!==me?`<span class="pill p-b">${t('editMember')}</span>`:''}</button>`;
  return `${head(t('t_account'),esc(LV.company?.name||''))}
  <section class="sec"><h2>${t('profile')}</h2>
    <form class="panel" style="padding:14px" data-form="profile">
      <div class="f2"><div class="f"><label for="pfName">${t('fullName')}</label><input id="pfName" name="full_name" type="text" maxlength="80" value="${esc(LV.profile?.full_name||'')}" required></div>
      <div class="f"><label for="pfPhone">${t('phone')}</label><input id="pfPhone" name="phone" type="tel" maxlength="20" value="${esc(LV.profile?.phone||'')}"></div></div>
      <div class="split"><span>${t('email')}: <b>${esc(LV.user.email||'')}</b></span><span>${t('yourRole')}: <b>${t('r_'+S.role)}</b></span></div>
      <div class="btns"><button class="btn sm">${t('save')}</button><button class="btn ghost sm" type="button" data-act="signout">${t('signout')}</button></div>
    </form></section>
  ${mgr?`<section class="sec"><h2>${t('inviteT')}</h2><div class="panel" style="padding:14px;display:flex;flex-direction:column;gap:10px">
      <p style="margin:0;color:var(--muted);font-size:13.5px">${t('inviteM')}</p>
      <div class="split"><span>${t('codeLbl')}</span><b class="num code">${esc(LV.company?.join_code||'')}</b></div>
      <div class="btns"><a class="btn" href="https://wa.me/?text=${encodeURIComponent(inviteText())}" target="_blank" rel="noopener">${IC.share}${t('sendInvite')}</a><button class="btn ghost" data-act="copy" data-text="${esc(inviteText())}">${IC.copy}${t('copyCode')}</button></div></div></section>
    <section class="sec"><h2>${t('requests')} ${pend.length?`<span class="pill p-warn num">${pend.length}</span>`:''}</h2>${pend.length?`<div class="panel rows">${pend.map(mrow).join('')}</div>`:`<div class="panel empty">${t('noRequests')}</div>`}</section>`:''}
  <section class="sec"><h2>${t('members')}</h2><div class="panel rows">${members.map(mrow).join('')}</div></section>
  ${mgr?`<section class="sec"><h2>${t('accountsT')}</h2><div class="panel rows">${D.accounts.map(a=>`<button class="row click" data-act="m-acc" data-id="${a.id}"><div class="grow"><div class="t">${esc(accName(a.id))}</div><div class="m">${t('ty_'+a.type)} · ${t('opening')}: ${plain(a.open)}</div></div><span class="amt">${money(accBal(a))}</span></button>`).join('')}</div></section>`:''}`;
}

// ---------- sign in screens ----------
function renderAuth(){
  $('top').innerHTML=`${brand()}${langBtn()}`;$('tabs').innerHTML='';$('rail').innerHTML='';
  const a=S.authScreen,msg=S.authMsg?`<div class="hint warn">${esc(S.authMsg)}</div>`:'';
  const busy=S.busy?' disabled':'';
  const demoBtn=`<button class="btn ghost block" type="button" data-act="demo">${t('tryDemo')}</button>`;
  let body='';
  if(a==='signin')body=`<h1>${t('signin')}</h1><p class="sub">${t('authSub')}</p>${msg}
    <form data-form="signin"><div class="f"><label for="aEmail">${t('email')}</label><input id="aEmail" name="email" type="email" autocomplete="email" required></div>
    <div class="f"><label for="aPass">${t('password')}</label><input id="aPass" name="password" type="password" autocomplete="current-password" required minlength="6"></div>
    <button class="btn block"${busy}>${t('signin')}</button></form>
    <div class="links"><button class="link" data-act="auth" data-s="forgot">${t('forgot')}</button><span>${t('noAccount')} <button class="link" data-act="auth" data-s="signup">${t('signup')}</button></span></div>${demoBtn}`;
  if(a==='signup')body=`<h1>${t('signup')}</h1><p class="sub">${t('signupSub')}</p>${msg}
    <form data-form="signup"><div class="f"><label for="aName">${t('fullName')}</label><input id="aName" name="full_name" type="text" autocomplete="name" required maxlength="80"></div>
    <div class="f"><label for="aEmail">${t('email')}</label><input id="aEmail" name="email" type="email" autocomplete="email" required></div>
    <div class="f"><label for="aPass">${t('password')}</label><input id="aPass" name="password" type="password" autocomplete="new-password" required minlength="6"></div>
    <button class="btn block"${busy}>${t('signup')}</button></form>
    <div class="links"><span>${t('haveAccount')} <button class="link" data-act="auth" data-s="signin">${t('signin')}</button></span></div>${demoBtn}`;
  if(a==='forgot')body=`<h1>${t('forgot')}</h1>${msg}<form data-form="forgot"><div class="f"><label for="aEmail">${t('email')}</label><input id="aEmail" name="email" type="email" required></div><button class="btn block"${busy}>${t('sendReset')}</button></form>
    <div class="links"><button class="link" data-act="auth" data-s="signin">${t('backSignin')}</button></div>`;
  if(a==='newpass')body=`<h1>${t('newPass')}</h1>${msg}<form data-form="newpass"><div class="f"><label for="aPass">${t('newPass')}</label><input id="aPass" name="password" type="password" autocomplete="new-password" required minlength="6"></div><button class="btn block"${busy}>${t('setPass')}</button></form>`;
  if(a==='check')body=`<h1>${t('checkEmail')}</h1><p class="sub">${esc(t('checkEmailM',{e:S.pendingEmail||''}))}</p><button class="btn block" data-act="auth" data-s="signin">${t('backSignin')}</button>`;
  if(a==='onboard')body=`<h1>${t('onboardT')}</h1><p class="sub">${t('onboardM')}</p>${msg}
    <form data-form="create-co" class="panel" style="padding:14px"><h2>${t('createCo')}</h2><div class="f"><label for="coName">${t('coName')}</label><input id="coName" name="company" type="text" required maxlength="80" placeholder="Gindi Studio"></div><p class="sub" style="margin:0">${t('coHint')}</p><button class="btn block"${busy}>${t('createCoBtn')}</button></form>
    <form data-form="join-co" class="panel" style="padding:14px"><h2>${t('joinCo')}</h2><div class="f"><label for="coCode">${t('joinCode')}</label><input id="coCode" name="code" type="text" required maxlength="12" autocapitalize="characters" style="text-transform:uppercase;letter-spacing:.2em;text-align:center"></div><button class="btn ghost block"${busy}>${t('joinBtn')}</button></form>
    <div class="links"><button class="link" data-act="signout">${t('signout')}</button></div>`;
  if(a==='pending')body=`<h1>${t('pendingT')}</h1><p class="sub">${esc(t('pendingM',{c:LV.company?.name||''}))}</p>${msg}<button class="btn block" data-act="refresh">${t('refresh')}</button><div class="links"><button class="link" data-act="signout">${t('signout')}</button></div>`;
  $('main').innerHTML=`<div class="auth"><div class="auth-card">${body}</div></div>`;
}

// ---------- modals ----------
function modal(title,body){
  $('modal').innerHTML=`<div class="scrim" data-act="close-scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mh"><div class="sheet-h"><h2 id="mh">${title}</h2><button class="x" data-act="close" aria-label="${t('close')}">${IC.x}</button></div>${body}</div></div>`;
  const f=$('modal').querySelector('input:not([type=hidden]):not([type=checkbox]),select');if(f)setTimeout(()=>f.focus(),30);
}
function closeModal(){$('modal').innerHTML='';if(reloadWaiting){reloadWaiting=false;refresh(true)}}
const opt=(v,l,sel)=>`<option value="${v}"${sel?' selected':''}>${esc(l)}</option>`;
const projOpts=(list,sel)=>list.map(p=>opt(p.id,tx(p.name),p.id===sel)).join('');
const accOpts=sel=>D.accounts.map((a,i)=>opt(a.id,`${accName(a.id)} — ${plain(accBal(a))}`,sel?a.id===sel||a.type===sel:i===0)).join('');
const engOpts=(sel,list=siteEngs())=>list.map(e=>opt(e,person(e),e===sel)).join('');
const itemOpts=pid=>{const p=P(pid);const own=p?allItems(p).map(i=>i[0]):[];const ks=p&&p.items.length?own:[...new Set(Object.keys(ITEMS).concat(own))];return ks.map(k=>opt(k,itemName(k))).join('')+opt('__other',t('otherItem'))};
const customRow=(nm,b)=>`<div class="f2"><input name="cn" type="text" maxlength="60" placeholder="${t('itemNameLbl')}" aria-label="${t('itemNameLbl')}" value="${esc(nm)}"><input name="cb" type="number" min="0" step="any" inputmode="decimal" placeholder="${t('budget')}" aria-label="${t('budget')}" value="${b>0?b:''}"></div>`;
function itemsEditor(items){
  const m=new Map(items),custom=items.filter(([k])=>!ITEMS[k]);
  return `<div class="f"><label>${t('itemsBudget')}</label><div class="f2">${Object.keys(ITEMS).map(k=>`<div class="f"><label for="nb_${k}" style="font-weight:700">${esc(itemName(k))}</label><input id="nb_${k}" name="b_${k}" type="number" min="0" step="any" inputmode="decimal" placeholder="—" value="${m.get(k)>0?m.get(k):''}"></div>`).join('')}</div></div>
  <div class="f"><label>${t('customItems')}</label><div id="customRows" class="custom-rows">${custom.map(([k,b])=>customRow(k,b)).join('')}${customRow('','')}</div><div><button class="btn ghost sm" type="button" data-act="add-item-row">${t('addItemRow')}</button></div></div>`;
}
function mItems(pid){const p=P(pid);if(!p)return;modal(t('editItems'),`<form data-form="items" data-id="${pid}">${itemsEditor(allItems(p))}${actions(t('save'))}</form>`)}
const actions=label=>`<div class="btns"><button class="btn" type="submit">${label}</button><button class="btn ghost" type="button" data-act="close">${t('cancel')}</button></div>`;

function mExp(){
  const site=S.role==='site';
  const list=myProjects();if(!list.length){toast(t('noAssigned'));return}
  const pid=(S.view==='project'&&list.find(p=>p.id===S.pid))?S.pid:list[0].id;
  modal(site?t('logExp'):t('directExp'),`<form data-form="exp">
    <div class="f2"><div class="f"><label for="ePrj">${t('e_project')}</label><select id="ePrj" name="project" data-change="expProject">${projOpts(list,pid)}</select></div>
    <div class="f"><label for="eItem">${t('e_item')}</label><select id="eItem" name="item" data-change="expCheck">${itemOpts(pid)}</select></div></div>
    <div class="f" id="eOtherBox" hidden><label for="eOther">${t('itemNameLbl')}</label><input id="eOther" name="item_other" type="text" maxlength="60" data-input="expCheck"></div>
    <div class="f"><label for="eAmt">${t('e_amount')}</label><input id="eAmt" name="amount" type="number" min="1" step="any" inputmode="decimal" required data-input="expCheck"></div>
    <div id="expWarn"></div>
    <div class="f"><label for="eNote">${t('e_note')}</label><input id="eNote" name="note" type="text" maxlength="120"></div>
    <div class="f"><label for="eVendor">${t('e_vendor')}</label><input id="eVendor" name="vendor" type="text" maxlength="80"></div>
    ${site?'':`<div class="f"><label for="eAcc">${t('e_source')}</label><select id="eAcc" name="acc">${accOpts('bank')}</select></div>`}
    <div class="f"><label for="eRc">${t('e_receipt')}</label><input id="eRc" name="receipt" type="file" accept="image/*"><span style="font-size:12px;color:var(--muted)">${t('receiptHint')}</span></div>
    ${site?`<div class="hint">${t('myBal')}: <b>${plain(engStats(ME.site).bal)}</b></div>`:''}
    ${actions(site?t('submitExp'):t('saveExp'))}</form>`);
}
function expCheck(){
  const f=$('modal').querySelector('form[data-form="exp"]');if(!f)return;
  const other=f.item.value==='__other';$('eOtherBox').hidden=!other;
  const p=P(f.project.value),k=other?itemKey(f.item_other.value):f.item.value,a=+f.amount.value||0;const b=(p.items.find(i=>i[0]===k)||[0,0])[1];
  const after=itemSpent(p,k)+itemSpent(p,k,'pending')+a;
  $('expWarn').innerHTML=a&&b>0&&after>b?`<div class="hint warn">${t('overWarn',{v:plain(after-b)})}</div>`:'';
}
function mGive(eng){if(!siteEngs().length){toast(t('noEngineers'));return}modal(t('giveCustody'),`<form data-form="give"><div class="f"><label for="gEng">${t('engineer')}</label><select id="gEng" name="eng">${engOpts(eng)}</select></div><div class="f"><label for="gAmt">${t('e_amount')}</label><input id="gAmt" name="amount" type="number" min="1" step="any" inputmode="decimal" required></div><div class="f"><label for="gAcc">${t('account')}</label><select id="gAcc" name="acc">${accOpts('cash')}</select></div>${actions(t('giveCustody'))}</form>`)}
function mXfer(){const e=siteEngs();modal(t('transfer'),`<form data-form="xfer"><div class="f2"><div class="f"><label for="xFrom">${t('fromEng')}</label><select id="xFrom" name="from">${engOpts(e[0])}</select></div><div class="f"><label for="xTo">${t('toEng')}</label><select id="xTo" name="to">${engOpts(e[1])}</select></div></div><div class="f"><label for="xAmt">${t('e_amount')}</label><input id="xAmt" name="amount" type="number" min="1" step="any" inputmode="decimal" required></div>${actions(t('transfer'))}</form>`)}
function mRet(eng){eng=eng||siteEngs()[0];const s=engStats(eng);modal(t('settle'),`<form data-form="ret"><div class="f"><label for="rEng">${t('engineer')}</label><select id="rEng" name="eng">${engOpts(eng)}</select></div><div class="hint">${t('available')}: <b>${plain(s.bal)}</b> · ${t('pendingShort')}: <b>${plain(s.pend)}</b></div><div class="f"><label for="rAmt">${t('e_amount')}</label><input id="rAmt" name="amount" type="number" min="1" step="any" inputmode="decimal" required value="${Math.max(0,Math.round(s.after))||''}"></div><div class="f"><label for="rAcc">${t('account')}</label><select id="rAcc" name="acc">${accOpts('cash')}</select></div>${actions(t('settle'))}</form>`)}
function mPay(){if(!D.projects.length){toast(t('noProjects'));return}const pid=S.view==='project'?S.pid:D.projects[0].id;modal(t('recordPay'),`<form data-form="pay"><div class="f"><label for="pPrj">${t('e_project')}</label><select id="pPrj" name="project">${projOpts(D.projects,pid)}</select></div><div class="f"><label for="pAmt">${t('e_amount')}</label><input id="pAmt" name="amount" type="number" min="1" step="any" inputmode="decimal" required></div><div class="f"><label for="pAcc">${t('account')}</label><select id="pAcc" name="acc">${accOpts('bank')}</select></div><div class="f"><label for="pNote">${t('e_note')}</label><input id="pNote" name="note" type="text" maxlength="120"></div>${actions(t('recordPay'))}</form>`)}
function mTask(pid){const list=myProjects();if(!list.length){toast(t('noAssigned'));return}pid=pid||(S.view==='project'?S.pid:list[0].id);
  const who=staff();
  modal(t('addTask'),`<form data-form="task"><div class="f"><label for="kTitle">${t('e_note')}</label><input id="kTitle" name="title" type="text" maxlength="120" required></div>
  <div class="f2"><div class="f"><label for="kPrj">${t('e_project')}</label><select id="kPrj" name="project">${projOpts(list,pid)}</select></div><div class="f"><label for="kType">${t('task')} / ${t('snag')}</label><select id="kType" name="type">${opt('task',t('task'))}${opt('snag',t('snag'))}</select></div></div>
  <div class="f2"><div class="f"><label for="kWho">${t('assignee')}</label><select id="kWho" name="who">${engOpts(S.role==='site'?ME.site:(who.find(w=>D.people[w].role==='site')||who[0]),who)}</select></div><div class="f"><label for="kDue">${t('due')}</label><input id="kDue" name="due" type="date" value="${day(-3)}" required></div></div>${actions(t('addTask'))}</form>`)}
function mProg(pid){const list=myProjects();if(!list.length){toast(t('noAssigned'));return}pid=pid||list[0].id;const p=P(pid);
  modal(t('updProg'),`<form data-form="prog"><div class="f"><label for="gPrj">${t('e_project')}</label><select id="gPrj" name="project" data-change="progProject">${projOpts(list,pid)}</select></div>
  <div class="f"><label for="gVal">${t('progress')}: <span id="gOut" class="num">${p.progress}%</span></label><input id="gVal" name="progress" type="range" min="0" max="100" value="${p.progress}" data-input="progOut"></div>
  <div class="f"><label for="gNote">${t('prog_note')}</label><textarea id="gNote" name="note" maxlength="200"></textarea></div>${actions(t('updProg'))}</form>`)}
async function mReceipt(id){const x=D.tx.find(y=>y.id===id);if(!x)return;const p=P(x.project);
  const foot=`<div class="split"><span>${x.by?t('fromCustody',{e:person(x.by)}):t('fromAcc',{a:accName(x.acc)})}</span>${statusPill(x.status)}</div>`;
  if(x.receipt&&x.receipt.startsWith('path:')){
    modal(t('receipt'),`<div class="empty">${t('loadingReceipt')}</div>`+foot);
    try{const d=await must(sb.storage.from('receipts').createSignedUrl(x.receipt.slice(5),3600));const box=$('modal').querySelector('.empty');if(box)box.outerHTML=`<img src="${esc(d.signedUrl)}" alt="${t('receipt')}" style="border-radius:8px">`}
    catch(e){const box=$('modal').querySelector('.empty');if(box)box.textContent=errMsg(e)}
    return;
  }
  const body=x.receipt&&x.receipt.startsWith('data:')?`<img src="${x.receipt}" alt="${t('receipt')}" style="border-radius:8px">`:x.receipt==='sample'?`<div class="rcpt"><div class="c">${X(x.vendor||'')}</div><div class="c" style="font-size:11px">${fdate(x.date)}</div><hr><div class="ln"><span>${X(x.note)}</span></div><div class="ln"><span>${esc(itemName(x.item))}</span><span>${p?X(p.name):''}</span></div><hr><div class="ln"><b>${t('totals')}</b><b>${plain(x.amount)}</b></div><div class="c" style="font-size:11px;margin-top:6px">— sample receipt —</div></div>`:`<div class="empty">${t('noReceipt')}</div>`;
  modal(t('receipt'),body+foot)}
function mProject(){
  modal(t('newProject'),`<form data-form="project">
    <div class="f"><label for="npName">${t('pName')}</label><input id="npName" name="name" type="text" maxlength="80" required></div>
    <div class="f2"><div class="f"><label for="npClient">${t('pClient')}</label><input id="npClient" name="client" type="text" maxlength="80"></div><div class="f"><label for="npArea">${t('pArea')}</label><input id="npArea" name="area" type="number" min="0" step="any" inputmode="decimal"></div></div>
    <div class="f"><label for="npLoc">${t('pLoc')}</label><input id="npLoc" name="loc" type="text" maxlength="120"></div>
    <div class="f2"><div class="f"><label for="npFeeT">${t('feeModel')}</label><select id="npFeeT" name="fee_type"><option value="pct">${t('fee_pct')}</option><option value="fixed">${t('fee_fixed')}</option></select></div><div class="f"><label for="npFeeV">${t('feeVal')}</label><input id="npFeeV" name="fee_value" type="number" min="0" step="any" inputmode="decimal" value="10"></div></div>
    ${itemsEditor([])}
    ${actions(t('newProject'))}</form>`);
}
function mMember(id){
  const pr=D.people[id];if(!pr)return;const role=pr.role==='pending'?'site':pr.role;
  const inP=p=>p.team.includes(id)||(p.clients||[]).includes(id);
  modal(t('editMember'),`<form data-form="member" data-id="${id}">
    <div class="row" style="padding:0"><div class="fi" style="padding:0"><div class="av">${esc(initial(id))}</div></div><div class="grow"><div class="t">${esc(person(id))}</div><div class="m">${pr.phone?esc(pr.phone):t('r_'+pr.role)}</div></div></div>
    <div class="f"><label for="mRole">${t('role')}</label><select id="mRole" name="role">${['site','office','client','manager'].map(r=>opt(r,t('r_'+r),r===role)).join('')}</select></div>
    <div class="f"><label>${t('projectsAccess')}</label>${D.projects.length?`<div class="panel rows">${D.projects.map(p=>`<label class="check row"><input type="checkbox" name="p" value="${p.id}"${inP(p)?' checked':''}> ${X(p.name)}</label>`).join('')}</div>`:`<div class="hint">${t('noProjects')}</div>`}</div>
    ${actions(t('save'))}
    <button class="btn bad sm" type="button" data-act="remove-member" data-id="${id}">${t('remove')}</button></form>`);
}
function mAcc(id){const a=D.accounts.find(x=>x.id===id);if(!a)return;
  modal(t('editAcc'),`<form data-form="acc" data-id="${id}"><div class="f"><label for="acName">${t('accName')}</label><input id="acName" name="name" type="text" maxlength="60" required value="${esc(a.name||accName(id))}"></div><div class="f"><label for="acOpen">${t('opening')}</label><input id="acOpen" name="opening" type="number" step="any" inputmode="decimal" value="${a.open}"></div>${actions(t('save'))}</form>`)}

// ---------- Excel export ----------
const XLSX_URL='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
let xlsxP=null;
function loadXLSX(){
  if(window.XLSX)return Promise.resolve(window.XLSX);
  if(!xlsxP)xlsxP=new Promise((res,rej)=>{const sc=document.createElement('script');sc.src=XLSX_URL;sc.onload=()=>res(window.XLSX);sc.onerror=()=>{xlsxP=null;sc.remove();rej(new Error('xlsx'))};document.head.appendChild(sc)});
  return xlsxP;
}
function exportSheets(){
  const r=S.role;
  if(r==='client')return ['sh_statement','sh_pay','sh_exp','sh_items','sh_tasks'];
  if(r==='site')return ['sh_exp','sh_cust','sh_custmov','sh_tasks'];
  if(r==='office')return ['sh_summary','sh_statement','sh_exp','sh_pay','sh_items','sh_tasks'];
  return ['sh_summary','sh_statement','sh_exp','sh_pay','sh_items','sh_cust','sh_custmov','sh_tre','sh_tremov','sh_tasks'];
}
function mExport(pid){
  const many=['manager','office'].includes(S.role);
  modal(t('exportT'),`<form data-form="export">
    ${many?`<div class="f"><label for="xScope">${t('scope')}</label><select id="xScope" name="pid">${opt('',t('allProjects'),!pid)}${projOpts(D.projects,pid)}</select></div>`:''}
    <div class="f2"><div class="f"><label for="xFrom">${t('fromD')}</label><input id="xFrom" name="from" type="date"></div><div class="f"><label for="xTo">${t('toD')}</label><input id="xTo" name="to" type="date"></div></div>
    <div class="hint">${t('periodHint')}</div>
    <div class="hint">${t('exportIncludes')} ${exportSheets().map(k=>t(k)).join('، ')}</div>
    <div class="btns"><button class="btn" type="submit" id="xGo" disabled>${t('preparing')}</button><button class="btn ghost" type="button" data-act="close">${t('cancel')}</button></div></form>`);
  loadXLSX().then(()=>{const b=$('xGo');if(b){b.disabled=false;b.textContent=t('exportBtn')}})
    .catch(()=>{const b=$('xGo');if(b)b.textContent=t('exportFail')});
}
function buildWorkbook(X,{pid,from,to}){
  const role=S.role,client=role==='client',site=role==='site',mgr=role==='manager';
  const inRange=d=>(!from||d>=from)&&(!to||d<=to);
  const projs=client?[clientProject()].filter(Boolean):pid?D.projects.filter(p=>p.id===pid):myProjects();
  const ids=new Set(projs.map(p=>p.id));
  const pn=id=>P(id)?tx(P(id).name):'';
  const showFee=p=>!client||p.showFee;
  const wb=X.utils.book_new();wb.Workbook={Views:[{RTL:S.lang==='ar'}]};
  const fmt=(ws,rows,cols)=>{
    ws['!cols']=cols.map((h,i)=>({wch:Math.min(48,Math.max(10,String(h).length+2,...rows.map(r=>r[i]==null?0:String(typeof r[i]==='number'?nf.format(r[i]):r[i]).length+2)))}));
    const rg=X.utils.decode_range(ws['!ref']||'A1');
    for(let R=0;R<=rg.e.r;R++)for(let C=0;C<=rg.e.c;C++){const c=ws[X.utils.encode_cell({r:R,c:C})];if(c&&c.t==='n'&&Math.abs(c.v)>=1000)c.z='#,##0'}
  };
  const add=(key,cols,rows,total)=>{
    const aoa=[cols,...rows];if(total)aoa.push(total);
    const ws=X.utils.aoa_to_sheet(aoa);fmt(ws,aoa,cols);
    if(rows.length)ws['!autofilter']={ref:X.utils.encode_range({s:{r:0,c:0},e:{r:rows.length,c:cols.length-1}})};
    X.utils.book_append_sheet(wb,ws,t(key).slice(0,31));
  };
  const sumCol=(rows,i)=>rows.reduce((a,r)=>a+(typeof r[i]==='number'?r[i]:0),0);
  const totalRow=(cols,rows,numIdx)=>cols.map((_,i)=>i===0?t('totals'):numIdx.includes(i)?sumCol(rows,i):'');
  const sheets=exportSheets();
  // info
  const info=[[t('company'),live()?(LV.company?.name||''):'Gindi Studio (demo)'],[t('exportedBy'),person(ME[role])+' — '+t('r_'+role)],[t('exportedAt'),todayISO()],
    [t('scope'),pid||client?projs.map(p=>tx(p.name)).join('، '):t('allProjects')],[t('period'),from||to?`${from||'…'} → ${to||'…'}`:t('allTime')],[t('currency'),t('egp')]];
  const wsI=X.utils.aoa_to_sheet(info);wsI['!cols']=[{wch:18},{wch:50}];X.utils.book_append_sheet(wb,wsI,t('sh_info').slice(0,31));
  // project summary
  if(sheets.includes('sh_summary')){
    const cols=[t('e_project'),t('client'),t('c_location'),t('c_area'),t('c_progress'),t('budget'),t('spent'),t('pendingShort'),t('paid'),t('c_feeModel'),t('fee'),t('balance')];
    const rows=projs.map(p=>[tx(p.name),tx(p.client),tx(p.loc),p.area||'',p.progress,budgetP(p),spent(p),pendingP(p),paidP(p),p.fee.type==='pct'?t('feeExplainPct',{v:p.fee.v}):t('feeExplainFixed',{v:plain(p.fee.v)}),Math.round(feeP(p)),Math.round(balP(p))]);
    add('sh_summary',cols,rows,totalRow(cols,rows,[5,6,7,8,10,11]));
  }
  // statements (all dates, running balance per project)
  if(sheets.includes('sh_statement')){
    const cols=[t('e_project'),t('date'),t('desc'),t('debit'),t('credit'),t('runBal')];const rows=[];
    projs.forEach(p=>{let run=0;
      D.tx.filter(x=>x.project===p.id&&(x.kind==='pay'||(x.kind==='exp'&&x.status==='approved'))).sort((a,b)=>a.date<b.date?-1:1).forEach(x=>{
        const cr=x.kind==='pay'?x.amount:0,dr=x.kind==='exp'?x.amount:0;run+=cr-dr;
        rows.push([tx(p.name),x.date,x.kind==='pay'?[t('clientPay'),tx(x.note)].filter(Boolean).join(' — '):[itemName(x.item),tx(x.note)].filter(Boolean).join(' — '),dr||'',cr||'',run]);
      });
      if(showFee(p)){const fee=Math.round(feeP(p));run-=fee;rows.push([tx(p.name),todayISO(),t('feeLine'),fee,'',run])}
      rows.push([tx(p.name),'',t('runBal'),'','',run],['','','','','','']);
    });
    add('sh_statement',cols,rows);
  }
  // expenses
  if(sheets.includes('sh_exp')){
    let list=D.tx.filter(x=>x.kind==='exp'&&ids.has(x.project)&&inRange(x.date));
    if(client)list=list.filter(x=>x.status==='approved');
    if(site)list=list.filter(x=>x.by===ME.site);
    list.sort((a,b)=>a.date<b.date?-1:1);
    const cols=client?[t('date'),t('e_project'),t('e_item'),t('desc'),t('e_vendor'),t('c_amount')]:[t('date'),t('e_project'),t('e_item'),t('desc'),t('e_vendor'),t('c_amount'),t('c_status'),t('e_source'),t('c_hasRcpt')];
    const rows=list.map(x=>{const base=[x.date,pn(x.project),itemName(x.item),tx(x.note),tx(x.vendor),x.amount];
      return client?base:base.concat([t(x.status),x.by?t('fromCustody',{e:person(x.by)}):t('fromAcc',{a:accName(x.acc)}),x.receipt?t('yes'):t('no')])});
    const tot=client?totalRow(cols,rows,[5]):cols.map((_,i)=>i===0?`${t('totals')} (${t('approved')})`:i===5?sum(list.filter(x=>x.status==='approved')):'');
    add('sh_exp',cols,rows,tot);
  }
  // client payments
  if(sheets.includes('sh_pay')){
    const list=D.tx.filter(x=>x.kind==='pay'&&ids.has(x.project)&&inRange(x.date)).sort((a,b)=>a.date<b.date?-1:1);
    const cols=client?[t('date'),t('e_project'),t('c_amount'),t('desc')]:[t('date'),t('e_project'),t('c_amount'),t('account'),t('desc')];
    const rows=list.map(x=>client?[x.date,pn(x.project),x.amount,tx(x.note)]:[x.date,pn(x.project),x.amount,accName(x.acc),tx(x.note)]);
    add('sh_pay',cols,rows,totalRow(cols,rows,[2]));
  }
  // item budgets (all dates)
  if(sheets.includes('sh_items')){
    const cols=client?[t('e_project'),t('e_item'),t('spent')]:[t('e_project'),t('e_item'),t('budget'),t('spent'),t('pendingShort'),t('remaining'),t('c_used')];
    const rows=[];projs.forEach(p=>allItems(p).forEach(([k,b])=>{const sp=itemSpent(p,k),pe=itemSpent(p,k,'pending');
      if(client){if(sp>0)rows.push([tx(p.name),itemName(k),sp])}else rows.push([tx(p.name),itemName(k),b,sp,pe,b-sp,b>0?Math.round(sp/b*100):''])}));
    add('sh_items',cols,rows,client?totalRow(cols,rows,[2]):totalRow(cols,rows,[2,3,4,5]));
  }
  // custody
  const engs=site?[ME.site]:siteEngs();
  if(sheets.includes('sh_cust')){
    const cols=[t('engineer'),t('given'),t('spentApproved'),t('returned'),t('pendingShort'),t('available'),t('afterPending')];
    const rows=engs.map(e=>{const s=engStats(e);return [person(e),s.given,s.spent,s.ret,s.pend,s.bal,s.after]});
    add('sh_cust',cols,rows,totalRow(cols,rows,[1,2,3,4,5,6]));
  }
  if(sheets.includes('sh_custmov')){
    const cols=[t('date'),t('engineer'),t('c_type'),t('c_details'),t('c_in'),t('c_out')];const rows=[];
    D.tx.filter(x=>inRange(x.date)).forEach(x=>{
      if(x.kind==='give'&&engs.includes(x.eng))rows.push([x.date,person(x.eng),t('k_give'),accName(x.acc),x.amount,'']);
      if(x.kind==='ret'&&engs.includes(x.eng))rows.push([x.date,person(x.eng),t('k_ret'),accName(x.acc),'',x.amount]);
      if(x.kind==='xfer'){if(engs.includes(x.from))rows.push([x.date,person(x.from),t('k_xfer'),`${t('toEng')} ${person(x.to)}`,'',x.amount]);if(engs.includes(x.to))rows.push([x.date,person(x.to),t('k_xfer'),`${t('fromEng')} ${person(x.from)}`,x.amount,''])}
      if(x.kind==='exp'&&x.status==='approved'&&x.by&&engs.includes(x.by))rows.push([x.date,person(x.by),t('k_exp'),[pn(x.project),itemName(x.item),tx(x.note)].filter(Boolean).join(' — '),'',x.amount]);
    });
    rows.sort((a,b)=>a[0]<b[0]?-1:1);
    add('sh_custmov',cols,rows,totalRow(cols,rows,[4,5]));
  }
  // treasury
  if(sheets.includes('sh_tre')){
    const cols=[t('accName'),t('c_type'),t('opening'),t('c_in'),t('c_out'),t('runBal')];
    const rows=D.accounts.map(a=>{let i=0,o=0;D.tx.forEach(x=>{if(x.acc!==a.id)return;if(x.kind==='pay'||x.kind==='ret')i+=x.amount;if(x.kind==='give'||(x.kind==='exp'&&x.status==='approved'))o+=x.amount});return [accName(a.id),t('ty_'+a.type),a.open,i,o,accBal(a)]});
    add('sh_tre',cols,rows,totalRow(cols,rows,[2,3,4,5]));
  }
  if(sheets.includes('sh_tremov')){
    const cols=[t('date'),t('account'),t('c_type'),t('c_details'),t('c_in'),t('c_out')];
    const list=D.tx.filter(x=>x.acc&&inRange(x.date)&&(x.kind!=='exp'||x.status==='approved')&&(!pid||x.project===pid||(!x.project&&false))).sort((a,b)=>a.date<b.date?-1:1);
    const rows=list.map(x=>{const inn=x.kind==='pay'||x.kind==='ret';
      const det=x.kind==='pay'?[pn(x.project),tx(x.note)].filter(Boolean).join(' — '):x.kind==='exp'?[pn(x.project),itemName(x.item),tx(x.note)].filter(Boolean).join(' — '):person(x.eng);
      return [x.date,accName(x.acc),x.kind==='pay'?t('clientPay'):x.kind==='exp'?t('directExp'):t('k_'+x.kind),det,inn?x.amount:'',inn?'':x.amount]});
    add('sh_tremov',cols,rows,totalRow(cols,rows,[4,5]));
  }
  // tasks & snags
  if(sheets.includes('sh_tasks')){
    let list=D.tasks.filter(k=>ids.has(k.project));
    if(client)list=list.filter(k=>k.type==='snag');
    const cols=[t('e_project'),t('c_type'),t('e_note'),t('assignee'),t('due'),t('c_status')];
    const rows=list.sort(taskSort).map(k=>[pn(k.project),t(k.type),tx(k.title),person(k.who),k.due||'',isLate(k)?t('late'):t(k.status)]);
    add('sh_tasks',cols,rows);
  }
  return wb;
}
async function runExport(f){
  const X=window.XLSX;if(!X){toast(t('preparing'));return}
  const v=Object.fromEntries(new FormData(f));
  const pid=v.pid||(S.role==='client'?'':null);
  const wb=buildWorkbook(X,{pid:v.pid||null,from:v.from||'',to:v.to||''});
  const scopeName=v.pid&&P(v.pid)?tx(P(v.pid).name):(S.role==='client'&&clientProject()?tx(clientProject().name):'');
  const ascii=scopeName.replace(/[^A-Za-z0-9 _-]+/g,'').trim().replace(/\s+/g,'-');
  const fname=`Gindi-Studio-${S.role==='client'?'statement':v.pid?(ascii||'project'):S.role==='site'?'my-expenses':'all-projects'}-${todayISO()}.xlsx`;
  const out=X.write(wb,{bookType:'xlsx',type:'array'});
  const blob=new Blob([out],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const touch=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
  if(touch&&navigator.canShare){
    try{const file=new File([blob],fname,{type:blob.type});if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:fname});closeModal();toast(t('exported'));return}}
    catch(e){if(e&&e.name==='AbortError')return}
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);closeModal();toast(t('exported'));
}

function readImg(file){return new Promise(res=>{if(!file||!file.size)return res(null);const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const s=Math.min(1,1000/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.72))};img.onerror=()=>res(null);img.src=r.result};r.onerror=()=>res(null);r.readAsDataURL(file)})}
const dataUrlToBlob=u=>fetch(u).then(r=>r.blob());
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2));

let toastT;function toast(m){$('toast').innerHTML=`<div>${esc(m)}</div>`;clearTimeout(toastT);toastT=setTimeout(()=>$('toast').innerHTML='',3000)}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);toast(t('copied'))}catch(err){modal(t('copy'),`<textarea readonly style="width:100%;min-height:160px;background:var(--surface-2);border:1px solid var(--line);border-radius:10px;padding:10px">${esc(txt)}</textarea>`);const ta=$('modal').querySelector('textarea');ta.focus();ta.select();toast(t('copyFail'))}}

// ---------- modes ----------
function startDemo(){D=loadDemo();S.mode='demo';S.role=pref('role')||'manager';ME={...DEMO_ME};S.view=null;pref('mode','demo');render()}
function toAuth(screen,msg){S.mode='auth';S.authScreen=screen||'signin';S.authMsg=msg||'';render()}

// ---------- events ----------
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,id=el.dataset.id;
  if(a==='close-scrim'&&e.target!==el)return;
  switch(a){
    case 'nav':go({view:el.dataset.view});break;
    case 'open':go({view:'project',pid:id,ptab:'overview'});break;
    case 'ptab':S.ptab=el.dataset.tab;render();break;
    case 'taskF':S.taskF=el.dataset.f;render();break;
    case 'alert':{const al=alerts()[+el.dataset.i];if(al)go(al.go);break}
    case 'lang':S.lang=S.lang==='ar'?'en':'ar';pref('lang',S.lang);closeModal();render();break;
    case 'reset':D=seed();saveDemo();render();toast(t('resetDone'));break;
    case 'demo':startDemo();break;
    case 'leave-demo':pref('mode','live');toAuth('signin');break;
    case 'auth':S.authScreen=el.dataset.s;S.authMsg='';render();break;
    case 'refresh':S.busy=true;await refresh();S.busy=false;break;
    case 'signout':unsubscribe();await sb.auth.signOut();store.del(CACHE_KEY);LV.user=null;LV.profile=null;LV.company=null;D=null;closeModal();toAuth('signin');break;
    case 'approve':case 'reject':{
      if(live()){try{await must(sb.rpc('decide_expense',{tx:id,approve:a==='approve'}));toast(t(a==='approve'?'didApprove':'didReject'));await refresh(true)}catch(err){toast(errMsg(err))}}
      else{const x=D.tx.find(y=>y.id===id);if(x){x.status=a==='approve'?'approved':'rejected';saveDemo();render();toast(t(a==='approve'?'didApprove':'didReject'))}}
      break}
    case 'tdone':case 'tstart':{const st=a==='tdone'?'done':'doing';
      if(live()){try{await must(sb.from('tasks').update({status:st}).eq('id',id));toast(t(a==='tdone'?'didDone':'didStart'));await refresh(true)}catch(err){toast(errMsg(err))}}
      else{const k=D.tasks.find(y=>y.id===id);if(k){k.status=st;saveDemo();render();toast(t(a==='tdone'?'didDone':'didStart'))}}
      break}
    case 'receipt':mReceipt(id);break;
    case 'm-exp':mExp();break;
    case 'm-give':mGive(id);break;
    case 'm-xfer':mXfer();break;
    case 'm-ret':mRet(id);break;
    case 'm-pay':mPay();break;
    case 'm-task':mTask(id);break;
    case 'm-prog':mProg(id);break;
    case 'm-project':mProject();break;
    case 'm-member':mMember(id);break;
    case 'm-acc':mAcc(id);break;
    case 'm-items':mItems(id);break;
    case 'm-export':mExport(id);break;
    case 'add-item-row':{const box=$('customRows');box.insertAdjacentHTML('beforeend',customRow('',''));box.lastElementChild.querySelector('input').focus();break}
    case 'remove-member':
      if(el.dataset.confirm!=='1'){el.dataset.confirm='1';el.textContent=t('confirmRemove');break}
      try{await must(sb.rpc('remove_member',{member:id}));toast(t('didRemove'));closeModal();await refresh(true)}catch(err){toast(errMsg(err))}
      break;
    case 'close':case 'close-scrim':closeModal();break;
    case 'copy':copyText(el.dataset.text||'');break;
  }
});
document.addEventListener('change',e=>{
  const c=e.target.dataset.change;if(!c)return;
  if(c==='role'){S.role=e.target.value;pref('role',S.role);S.view=null;closeModal();render();window.scrollTo({top:0})}
  if(c==='expProject'){$('eItem').innerHTML=itemOpts(e.target.value);expCheck()}
  if(c==='expCheck')expCheck();
  if(c==='progProject'){const p=P(e.target.value);$('gVal').value=p.progress;$('gOut').textContent=p.progress+'%'}
});
document.addEventListener('input',e=>{const c=e.target.dataset.input;if(c==='expCheck')expCheck();if(c==='progOut')$('gOut').textContent=e.target.value+'%'});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('modal').innerHTML)closeModal()});

async function submitAuth(kind,v){
  const busyRender=()=>{S.busy=true;render()};
  try{
    if(kind==='signin'){busyRender();const d=await must(sb.auth.signInWithPassword({email:v.email.trim(),password:v.password}));LV.user=d.user;S.authMsg='';S.view=null;await refresh();subscribe()}
    if(kind==='signup'){
      if((v.password||'').length<6)throw new Error('Password should be at least 6 characters');
      busyRender();
      const d=await must(sb.auth.signUp({email:v.email.trim(),password:v.password,options:{data:{full_name:v.full_name.trim()},emailRedirectTo:location.origin+location.pathname}}));
      if(d.user&&Array.isArray(d.user.identities)&&d.user.identities.length===0)throw new Error('User already registered');
      if(d.session){LV.user=d.user;S.authMsg='';await refresh();subscribe()}else{S.pendingEmail=v.email.trim();toAuth('check')}
    }
    if(kind==='forgot'){busyRender();await must(sb.auth.resetPasswordForEmail(v.email.trim(),{redirectTo:location.origin+location.pathname}));toAuth('signin',t('resetSent'))}
    if(kind==='newpass'){busyRender();await must(sb.auth.updateUser({password:v.password}));toast(t('passSaved'));const {data:{session}}=await sb.auth.getSession();if(session){LV.user=session.user;await refresh();subscribe()}else toAuth('signin')}
    if(kind==='create-co'){busyRender();await must(sb.rpc('create_company',{company_name:v.company.trim(),full_name:LV.profile?.full_name||''}));await refresh();subscribe()}
    if(kind==='join-co'){busyRender();await must(sb.rpc('join_company',{code:v.code.trim(),full_name:LV.profile?.full_name||''}));await refresh();subscribe()}
  }catch(err){S.authMsg=errMsg(err);if(S.mode!=='auth')S.mode='auth'}
  finally{S.busy=false;if(S.mode==='auth')render()}
}

document.addEventListener('submit',async e=>{
  const f=e.target.closest('form[data-form]');if(!f)return;e.preventDefault();
  const v=Object.fromEntries(new FormData(f));const kind=f.dataset.form;const amt=+v.amount;
  if(['signin','signup','forgot','newpass','create-co','join-co'].includes(kind)){if(!S.busy)submitAuth(kind,v);return}
  if(kind==='export'){runExport(f).catch(err=>toast(errMsg(err)));return}
  if(['exp','give','xfer','ret','pay'].includes(kind)&&!(amt>0)){toast(t('needAmount'));return}
  if(kind==='xfer'&&v.from===v.to){toast(t('sameEng'));return}
  if(kind==='task'&&!(v.title||'').trim()){toast(t('needTitle'));return}
  if(kind==='exp'&&v.item==='__other'){v.item=itemKey(v.item_other);if(!v.item){toast(t('needItemName'));return}}
  const btn=f.querySelector('button[type=submit],button:not([type])');if(btn){if(btn.disabled)return;btn.disabled=true}
  const done=msg=>{toast(msg);closeModal();};
  try{
    if(live())await submitLive(kind,v,f);else submitDemo(kind,v,f);
  }catch(err){toast(errMsg(err));if(btn)btn.disabled=false;return}
});

async function submitLive(kind,v,f){
  const co=LV.profile.company_id,amt=+v.amount,ins=row=>must(sb.from('transactions').insert({company_id:co,...row}));
  let msg='';
  if(kind==='exp'){
    const site=S.role==='site';let path=null;
    const dataUrl=await readImg(f.receipt.files[0]);
    if(dataUrl){path=`${co}/${uuid()}.jpg`;await must(sb.storage.from('receipts').upload(path,await dataUrlToBlob(dataUrl),{contentType:'image/jpeg'}))}
    await ins(site?{kind:'exp',project_id:v.project,item:v.item,amount:amt,engineer_id:LV.user.id,status:'pending',vendor:v.vendor||null,note:v.note||null,receipt_path:path}
                  :{kind:'exp',project_id:v.project,item:v.item,amount:amt,account_id:v.acc,status:'approved',vendor:v.vendor||null,note:v.note||null,receipt_path:path});
    msg=t(site?'didLog':'didDirect');
  }
  if(kind==='give'){await ins({kind:'give',engineer_id:v.eng,account_id:v.acc,amount:amt});msg=t('didGive')}
  if(kind==='xfer'){await ins({kind:'xfer',engineer_id:v.from,to_engineer_id:v.to,amount:amt});msg=t('didXfer')}
  if(kind==='ret'){await ins({kind:'ret',engineer_id:v.eng,account_id:v.acc,amount:amt});msg=t('didRet')}
  if(kind==='pay'){await ins({kind:'pay',project_id:v.project,account_id:v.acc,amount:amt,note:v.note||null});msg=t('didPay')}
  if(kind==='task'){await must(sb.from('tasks').insert({company_id:co,project_id:v.project,type:v.type,title:v.title.trim(),assignee_id:v.who||null,due:v.due||null}));msg=t('didAddTask')}
  if(kind==='prog'){await must(sb.rpc('update_progress',{p:v.project,new_progress:+v.progress,note:v.note||''}));msg=t('didProg')}
  if(kind==='fee'){await must(sb.from('projects').update({fee_type:v.type,fee_value:Math.max(0,+v.v||0),show_fee:!!v.show}).eq('id',f.dataset.id));msg=t('saved')}
  if(kind==='project'){
    if(!(v.name||'').trim()){toast(t('needName'));const b=f.querySelector('button[type=submit]');if(b)b.disabled=false;return}
    const items=collectItems(new FormData(f)).map(([k,b])=>({k,b}));
    const row=await must(sb.from('projects').insert({company_id:co,name:v.name.trim(),client_name:(v.client||'').trim(),location:(v.loc||'').trim(),area:+v.area||0,fee_type:v.fee_type,fee_value:+v.fee_value||0,items}).select('id').single());
    msg=t('didProject');closeModal();toast(msg);await refresh(true);go({view:'project',pid:row.id,ptab:'overview'});return;
  }
  if(kind==='member'){
    const ps=new FormData(f).getAll('p');
    if(v.role==='client'&&!ps.length){toast(t('clientNeedsProject'));const b=f.querySelector('button[type=submit]');if(b)b.disabled=false;return}
    await must(sb.rpc('set_member',{member:f.dataset.id,new_role:v.role,project_ids:ps}));msg=t('didSetMember');
  }
  if(kind==='items'){await must(sb.from('projects').update({items:collectItems(new FormData(f)).map(([k,b])=>({k,b}))}).eq('id',f.dataset.id));msg=t('saved')}
  if(kind==='acc'){await must(sb.from('accounts').update({name:(v.name||'').trim()||'—',opening:+v.opening||0}).eq('id',f.dataset.id));msg=t('saved')}
  if(kind==='profile'){await must(sb.from('profiles').update({full_name:(v.full_name||'').trim(),phone:(v.phone||'').trim()||null}).eq('id',LV.user.id));msg=t('saved')}
  closeModal();toast(msg);await refresh(true);
}
function submitDemo(kind,v,f){
  const date=todayISO(),amt=+v.amount,nid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  const finish=msg=>{saveDemo();closeModal();render();toast(msg)};
  if(kind==='exp'){
    const site=S.role==='site';
    readImg(f.receipt.files[0]).then(rc=>{
      D.tx.push({id:nid('t'),kind:'exp',date,project:v.project,item:v.item,amount:amt,by:site?ME.site:undefined,acc:site?undefined:v.acc,status:site?'pending':'approved',receipt:rc,vendor:v.vendor||'',note:v.note||itemName(v.item)});
      finish(t(site?'didLog':'didDirect'));
    });return;
  }
  if(kind==='give'){D.tx.push({id:nid('t'),kind:'give',date,eng:v.eng,amount:amt,acc:v.acc});return finish(t('didGive'))}
  if(kind==='xfer'){D.tx.push({id:nid('t'),kind:'xfer',date,from:v.from,to:v.to,amount:amt});return finish(t('didXfer'))}
  if(kind==='ret'){D.tx.push({id:nid('t'),kind:'ret',date,eng:v.eng,amount:amt,acc:v.acc});return finish(t('didRet'))}
  if(kind==='pay'){D.tx.push({id:nid('t'),kind:'pay',date,project:v.project,amount:amt,acc:v.acc,note:v.note||t('clientPay')});return finish(t('didPay'))}
  if(kind==='task'){D.tasks.push({id:nid('k'),project:v.project,type:v.type,title:v.title.trim(),who:v.who,due:v.due,status:'todo'});return finish(t('didAddTask'))}
  if(kind==='prog'){const p=P(v.project);p.progress=+v.progress;D.updates.push({project:p.id,by:ME[S.role]==='hisham'?'karim':ME[S.role],date,progress:p.progress,note:v.note||`${t('progress')} ${p.progress}%`});return finish(t('didProg'))}
  if(kind==='items'){P(f.dataset.id).items=collectItems(new FormData(f));return finish(t('saved'))}
  if(kind==='fee'){const p=P(f.dataset.id);p.fee={type:v.type,v:Math.max(0,+v.v||0)};p.showFee=!!v.show;return finish(t('saved'))}
  if(kind==='project'){if(!(v.name||'').trim()){toast(t('needName'));const b=f.querySelector('button[type=submit]');if(b)b.disabled=false;return}
    const items=collectItems(new FormData(f));const id=nid('p');
    D.projects.push({id,name:v.name.trim(),client:(v.client||'').trim(),area:+v.area||0,loc:(v.loc||'').trim(),progress:0,fee:{type:v.fee_type,v:+v.fee_value||0},showFee:true,team:[],items});
    saveDemo();closeModal();toast(t('didProject'));go({view:'project',pid:id,ptab:'overview'});return}
}

// ---------- start ----------
async function boot(){
  render();
  if(!sb){startDemo();return}
  sb.auth.onAuthStateChange((ev,session)=>{
    if(ev==='PASSWORD_RECOVERY'){LV.user=session?.user||null;toAuth('newpass')}
    if(ev==='SIGNED_OUT'&&S.mode==='live'){unsubscribe();toAuth('signin')}
  });
  let session=null;
  try{session=(await sb.auth.getSession()).data.session}catch(e){}
  if(RECOVERY&&session){LV.user=session.user;toAuth('newpass');return}
  if(session){LV.user=session.user;await refresh();if(live())subscribe()}
  else if(pref('mode')==='demo')startDemo();
  else toAuth('signin');
}
boot();
})();
