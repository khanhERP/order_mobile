export interface POSTranslations {
  title: string;
  cashierName: string;
  beforeWork: string;
  defaultCashier: string;
  currentlyOutOfStock: string;
  outOfStock: string;
  inStock: string;
  addedToCart: string;
  categories: string;
  allCategories: string;
  selectCategory: string;
  product: string;
  products: string;
  cart: string;
  quantity: string;
  totalAmount: string;
  receiptNumber: string;
  transactionId: string;
  customerInfo: string;
  customerName: string;
  customerPhone: string;
  paymentComplete: string;
  thankYou: string;
  receipt: string;
  purchaseHistory: string;
  today: string;
  yesterday: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  productsAvailable: string;
  gridView: string;
  listView: string;
  sortByName: string;
  sortByPrice: string;
  sortByStock: string;
  noProductsFound: string;
  noProductsInCategory: string;
  searchProducts: string;
  scanBarcode: string;
  productScanned: string;
  scanFailed: string;
  productNotFound: string;
  addItemsToCart: string;
  emptyCart: string;
  clearCart: string;
  checkout: string;
  payment: string;
  cash: string;
  card: string;
  debitCard: string;
  change: string;
  orderComplete: string;
  printReceipt: string;
  newOrder: string;
  newTransaction: string;
  paymentMethodLabel: string;
  transactionComplete: string;
  transactionFailed: string;
  manageProducts: string;
  productManager: string;
  productName: string;
  sku: string;
  stock: string;
  imageUrl: string;
  isActive: string;
  addProductsToStart: string;
  allProducts: string;
  popular: string;
  lowStock: string;
  stockCount: string;
  price: string;
  category: string;
  description: string;
  barcode: string;
  costPrice: string;
  sellingPrice: string;
  taxRate: string;
  discount: string;
  unit: string;
  supplier: string;
  expiryDate: string;
  batchNumber: string;
  location: string;
  minStock: string;
  maxStock: string;
  reorderPoint: string;
  notes: string;
  addedToCartShort: string;
  hasBeenAddedToOrder: string;
  addedToOrderToast: string;
  receiptPreview: string;
  cancel: string;
  confirmAndSelectPayment: string;
  thankYouBusiness: string;
  keepReceiptRecords: string;
  bulkImport: string;
  bulkImportTitle: string;
  bulkImportInstructions: string;
  downloadTemplate: string;
  fillProductInfo: string;
  uploadAndPreview: string;
  clickImportToComplete: string;
  downloadTemplateButton: string;
  selectExcelFile: string;
  processing: string;
  dataErrors: string;
  dataPreview: string;
  productsCount: string;
  importProducts: string;
  importing: string;
  completedWithErrors: string;
  errorReportDownloaded: string;
  bulkImportSuccess: string;
  bulkImportError: string;
  cannotReadFile: string;
  missingRequiredInfo: string;
  productNameRequired: string;
  skuRequired: string;
  invalidPrice: string;
  invalidCategoryId: string;
  invalidTaxRate: string;
  duplicateSku: string;
  productsSuccessful: string;
  productsWithErrors: string;
  duplicateSkuCount: string;
  each: string;
  mainStoreLocation: string;
  transactionNumber: string;
  date: string;
  cashier: string;
  subtotal: string;
  tax: string;
  total: string;
  paymentMethod: string;
  amountReceived: string;
  phone: string;
  printerConfiguration: string;
  addNewPrinter: string;
  editPrinter: string;
  printerName: string;
  printerType: string;
  thermal: string;
  inkjet: string;
  laser: string;
  connectionType: string;
  network: string;
  bluetooth: string;
  ipAddress: string;
  port: string;
  macAddress: string;
  employeePrinter: string;
  kitchenPrinter: string;
  inUse: string;
  addNew: string;
  update: string;
  printerList: string;
  printers: string;
  off: string;
  test: string;
  edit: string;
  employee: string;
  kitchen: string;
  using: string;
  close: string;
  loading: string;
  noPrinterConfigs: string;
  cancel: string;
  posLocation: string;
  floor: string;
  zone: string;
}

export const posTranslations: { [key: string]: POSTranslations } = {
  ko: {
    title: "POS 시스템",
    cashierName: "계산원 이름",
    beforeWork: "근무자 출근전",
    defaultCashier: "김담당자",
    currentlyOutOfStock: "현재 품절입니다",
    outOfStock: "품절",
    inStock: "재고 있음",
    addedToCart: "장바구니에 추가됨",
    categories: "카테고리",
    allCategories: "전체",
    selectCategory: "카테고리 선택",
    product: "상품",
    products: "상품",
    cart: "장바구니",
    quantity: "수량",
    totalAmount: "총 금액",
    receiptNumber: "영수증 번호",
    transactionId: "거래 ID",
    customerInfo: "고객 정보",
    customerName: "고객명",
    customerPhone: "고객 전화번호",
    paymentComplete: "결제 완료",
    thankYou: "감사합니다",
    receipt: "영수증",
    purchaseHistory: "구매 내역",
    today: "오늘",
    yesterday: "어제",
    thisWeek: "이번 주",
    thisMonth: "이번 달",
    thisYear: "올해",
    productsAvailable: "개 상품 사용 가능",
    gridView: "그리드 보기",
    listView: "목록 보기",
    sortByName: "이름순 정렬",
    sortByPrice: "가격순 정렬",
    sortByStock: "재고순 정렬",
    noProductsFound: "상품을 찾을 수 없습니다",
    noProductsInCategory: "이 카테고리에는 상품이 없습니다",
    searchProducts: "상품 검색...",
    scanBarcode: "바코드 스캔",
    productScanned: "상품 스캔됨",
    scanFailed: "스캔 실패",
    productNotFound: "상품을 찾을 수 없습니다",
    addItemsToCart: "상품을 장바구니에 추가하여 시작하세요",
    emptyCart: "장바구니가 비어있습니다",
    clearCart: "장바구니 비우기",
    checkout: "결제",
    payment: "결제",
    cash: "현금",
    card: "카드",
    debitCard: "직불카드",
    amountReceived: "받은 금액",
    change: "거스름돈",
    paymentMethod: "결제 방법",
    orderComplete: "주문 완료",
    printReceipt: "영수증 출력",
    newOrder: "새 주문",
    newTransaction: "새 거래",
    transactionComplete: "거래 완료",
    transactionFailed: "거래 실패",
    manageProducts: "상품 관리",
    productManager: "상품 관리",
    productName: "상품명",
    sku: "SKU",
    stock: "재고",
    imageUrl: "이미지 URL",
    isActive: "활성 상태",
    addProductsToStart: "시작하려면 상품을 추가하세요",
    allProducts: "모든 상품",
    popular: "인기",
    lowStock: "재고 부족",
    stockCount: "재고 수량",
    price: "가격",
    category: "카테고리",
    description: "설명",
    barcode: "바코드",
    costPrice: "원가",
    sellingPrice: "판매가",
    taxRate: "세율",
    discount: "할인",
    unit: "단위",
    supplier: "공급업체",
    expiryDate: "유효기간",
    batchNumber: "배치 번호",
    location: "위치",
    minStock: "최소 재고",
    maxStock: "최대 재고",
    reorderPoint: "재주문 시점",
    notes: "메모",
    addedToCartShort: "장바구니에 추가됨",
    hasBeenAddedToOrder: "이(가) 주문에 추가되었습니다",
    addedToOrderToast: "이(가) 주문에 추가되었습니다",
    receiptPreview: "영수증 미리보기",
    cancel: "취소",
    confirmAndSelectPayment: "확인 및 결제 선택",
    thankYouBusiness: "이용해 주셔서 감사합니다!",
    keepReceiptRecords: "영수증을 기록용으로 보관해 주세요",
    bulkImport: "일괄 가져오기",
    bulkImportTitle: "일괄 가져오기",
    bulkImportInstructions:
      "Excel 파일을 다운로드하고 제품 정보를 채운 다음 업로드하여 제품을 가져옵니다.",
    downloadTemplate: "템플릿 다운로드",
    fillProductInfo: "제품 정보 채우기",
    uploadAndPreview: "업로드 및 미리보기",
    clickImportToComplete: "가져오기를 완료하려면 클릭",
    downloadTemplateButton: "템플릿 다운로드",
    selectExcelFile: "Excel 파일 선택",
    processing: "처리 중",
    dataErrors: "데이터 오류",
    dataPreview: "데이터 미리보기",
    productsCount: "제품 수",
    importProducts: "제품 가져오기",
    importing: "가져오는 중",
    completedWithErrors: "오류로 완료됨",
    errorReportDownloaded: "오류 보고서가 다운로드되었습니다",
    bulkImportSuccess: "일괄 가져오기 성공",
    bulkImportError: "일괄 가져오기 오류",
    cannotReadFile: "파일을 읽을 수 없습니다",
    missingRequiredInfo: "필수 정보 누락",
    productNameRequired: "제품 이름을 입력해야 합니다",
    skuRequired: "SKU는 필수입니다",
    invalidPrice: "가격이 올바르지 않습니다",
    invalidCategoryId: "잘못된 카테고리 ID",
    invalidTaxRate: "잘못된 세율",
    duplicateSku: "중복 SKU",
    productsSuccessful: "성공적으로 가져온 제품",
    productsWithErrors: "오류가 있는 제품",
    duplicateSkuCount: "중복 SKU 수",
    each: "개당",
    mainStoreLocation: "본점 위치",
    transactionNumber: "거래번T:",
    date: "날짜:",
    cashier: "계산원:",
    subtotal: "소계:",
    tax: "세금:",
    total: "총계:",
    phone: "전화:",

    // Printer configuration
    printerConfiguration: "프린터 구성",
    addNewPrinter: "새 프린터 추가",
    editPrinter: "프린터 편집",
    printerName: "프린터 이름",
    printerType: "프린터 유형",
    thermal: "열전사",
    inkjet: "잉크젯",
    laser: "레이저",
    connectionType: "연결 유형",
    network: "네트워크",
    bluetooth: "블루투스",
    ipAddress: "IP 주소",
    port: "포트",
    macAddress: "MAC 주소",
    employeePrinter: "직원 프린터",
    kitchenPrinter: "주방 프린터",
    inUse: "사용 중",
    addNew: "새로 추가",
    update: "업데이트",
    printerList: "프린터 목록",
    printers: "프린터",
    off: "끄기",
    test: "테스트",
    edit: "편집",
    employee: "직원",
    kitchen: "주방",
    using: "사용 중",
    close: "닫기",
    loading: "로딩 중...",
    noPrinterConfigs: "프린터 구성이 없습니다",
    cancel: "취소",
    posLocation: "POS 위치",
    floor: "층",
    zone: "구역",
  },
  en: {
    title: "POS System",
    cashierName: "Cashier Name",
    beforeWork: "Before Work Start",
    defaultCashier: "Default Cashier",
    currentlyOutOfStock: "Currently out of stock",
    outOfStock: "Out of Stock",
    inStock: "In Stock",
    addedToCart: "Added to cart",
    categories: "Categories",
    allCategories: "All",
    selectCategory: "Select Category",
    product: "Product",
    products: "Products",
    cart: "Cart",
    quantity: "Quantity",
    totalAmount: "Total Amount",
    receiptNumber: "Receipt Number",
    transactionId: "Transaction ID",
    customerInfo: "Customer Info",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    paymentComplete: "Payment Complete",
    thankYou: "Thank You",
    receipt: "Receipt",
    purchaseHistory: "Purchase History",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year",
    productsAvailable: "products available",
    gridView: "Grid View",
    listView: "List View",
    sortByName: "Sort by Name",
    sortByPrice: "Sort by Price",
    sortByStock: "Sort by Stock",
    noProductsFound: "No products found",
    noProductsInCategory: "No products in this category",
    searchProducts: "Search products...",
    scanBarcode: "Scan Barcode",
    productScanned: "Product Scanned",
    scanFailed: "Scan Failed",
    productNotFound: "Product not found",
    addItemsToCart: "Add items to cart to get started",
    emptyCart: "Your cart is empty",
    clearCart: "Clear Cart",
    checkout: "Checkout",
    payment: "Payment",
    cash: "Cash",
    card: "Card",
    debitCard: "Debit Card",
    amountReceived: "Amount Received",
    change: "Change",
    paymentMethod: "Payment Method",
    orderComplete: "Order Complete",
    printReceipt: "Print Receipt",
    newOrder: "New Order",
    newTransaction: "New Transaction",
    transactionComplete: "Transaction Complete",
    transactionFailed: "Transaction Failed",
    manageProducts: "Manage Products",
    productManager: "Product Manager",
    productName: "Product Name",
    sku: "SKU",
    stock: "Stock",
    imageUrl: "Image URL",
    isActive: "Active",
    addProductsToStart: "Add products to get started",
    allProducts: "All Products",
    popular: "Popular",
    lowStock: "Low Stock",
    stockCount: "Stock Count",
    price: "Price",
    category: "Category",
    description: "Description",
    barcode: "Barcode",
    costPrice: "Cost Price",
    sellingPrice: "Selling Price",
    taxRate: "Tax Rate",
    discount: "Discount",
    unit: "Unit",
    supplier: "Supplier",
    expiryDate: "Expiry Date",
    batchNumber: "Batch Number",
    location: "Location",
    minStock: "Min Stock",
    maxStock: "Max Stock",
    reorderPoint: "Reorder Point",
    notes: "Notes",
    addedToCartShort: "Added to cart",
    hasBeenAddedToOrder: " has been added to order",
    addedToOrderToast: " has been added to order",
    receiptPreview: "Receipt Preview",
    cancel: "Cancel",
    confirmAndSelectPayment: "Confirm & Select Payment",
    thankYouBusiness: "Thank you for your business!",
    keepReceiptRecords: "Please keep this receipt for your records",
    bulkImport: "Bulk Import",
    bulkImportTitle: "Bulk Import Products",
    bulkImportInstructions:
      "Download the Excel file, fill in product information, then upload to import products.",
    downloadTemplate: "Download Template",
    fillProductInfo: "Fill Product Info",
    uploadAndPreview: "Upload & Preview",
    clickImportToComplete: "Click to Complete Import",
    downloadTemplateButton: "Download Template",
    selectExcelFile: "Select Excel File",
    processing: "Processing",
    dataErrors: "Data Errors",
    dataPreview: "Data Preview",
    productsCount: "Products Count",
    importProducts: "Import Products",
    importing: "Importing",
    completedWithErrors: "Completed with Errors",
    errorReportDownloaded: "Error report downloaded",
    bulkImportSuccess: "Bulk Import Success",
    bulkImportError: "Bulk Import Error",
    cannotReadFile: "Cannot read file",
    missingRequiredInfo: "Missing required info",
    productNameRequired: "Product name is required",
    skuRequired: "SKU is required",
    invalidPrice: "Invalid price",
    invalidCategoryId: "Invalid category ID",
    invalidTaxRate: "Invalid tax rate",
    duplicateSku: "Duplicate SKU",
    productsSuccessful: "Products successful",
    productsWithErrors: "Products with errors",
    duplicateSkuCount: "Duplicate SKU count",
    each: "each",
    mainStoreLocation: "Main Store Location",
    transactionNumber: "Transaction #:",
    date: "Date:",
    cashier: "Cashier:",
    subtotal: "Subtotal:",
    tax: "Tax (8.25%):",
    total: "Total:",
    paymentMethodLabel: "Payment Method:",
    amountReceivedLabel: "Amount Received:",
    phone: "Phone:",

    // Printer configuration
    printerConfiguration: "Printer Configuration",
    addNewPrinter: "Add New Printer",
    editPrinter: "Edit Printer",
    printerName: "Printer Name",
    printerType: "Printer Type",
    thermal: "Thermal",
    inkjet: "Inkjet",
    laser: "Laser",
    connectionType: "Connection Type",
    network: "Network",
    bluetooth: "Bluetooth",
    ipAddress: "IP Address",
    port: "Port",
    macAddress: "MAC Address",
    employeePrinter: "Employee Printer",
    kitchenPrinter: "Kitchen Printer",
    inUse: "In Use",
    addNew: "Add New",
    update: "Update",
    printerList: "Printer List",
    printers: "printers",
    off: "Off",
    test: "Test",
    edit: "Edit",
    employee: "Employee",
    kitchen: "Kitchen",
    using: "Using",
    close: "Close",
    loading: "Loading...",
    noPrinterConfigs: "No printer configurations",
    cancel: "Cancel",
    posLocation: "POS Location",
    floor: "Floor",
    zone: "Zone",
    
    // Additional POS keys
    quickSale: "Quick Sale",
    multiplePayments: "Multiple Payments", 
    splitPayment: "Split Payment",
    refund: "Refund",
    exchange: "Exchange",
    loyalty: "Loyalty",
    membercard: "Member Card",
    giftCard: "Gift Card",
    coupon: "Coupon",
    promotion: "Promotion",
    taxExempt: "Tax Exempt",
    taxInclusive: "Tax Inclusive",
    priceOverride: "Price Override",
    discountOverride: "Discount Override",
    managerApproval: "Manager Approval",
    verification: "Verification",
    authentication: "Authentication",
    authorization: "Authorization",
    salesReport: "Sales Report",
    dailyReport: "Daily Report",
    shiftReport: "Shift Report",
    cashierReport: "Cashier Report",
    productReport: "Product Report",
    categoryReport: "Category Report",
    paymentReport: "Payment Report",
    customerReport: "Customer Report",
  },
  vi: {
    title: "Hệ thống POS",
    cashierName: "Tên thu ngân",
    beforeWork: "Trước khi làm việc",
    defaultCashier: "Thu ngân mặc định",
    currentlyOutOfStock: "Hiện tại hết hàng",
    outOfStock: "Hết hàng",
    inStock: "Còn hàng",
    addedToCart: "Đã thêm vào giỏ",
    categories: "Danh mục",
    allCategories: "Tất cả",
    selectCategory: "Chọn danh mục",
    product: "Sản phẩm",
    products: "Sản phẩm",
    cart: "Giỏ hàng",
    quantity: "Số lượng",
    totalAmount: "Tổng tiền",
    receiptNumber: "Số hóa đơn",
    transactionId: "Mã giao dịch",
    customerInfo: "Thông tin khách hàng",
    customerName: "Tên khách hàng",
    customerPhone: "Số điện thoại khách hàng",
    paymentComplete: "Thanh toán hoàn tất",
    thankYou: "Cảm ơn bạn",
    receipt: "Hóa đơn",
    purchaseHistory: "Lịch sử mua hàng",
    today: "Hôm nay",
    yesterday: "Hôm qua",
    thisWeek: "Tuần này",
    thisMonth: "Tháng này",
    thisYear: "Năm nay",
    productsAvailable: "sản phẩm có sẵn",
    gridView: "Xem dạng lưới",
    listView: "Xem dạng danh sách",
    sortByName: "Sắp xếp theo tên",
    sortByPrice: "Sắp xếp theo giá",
    sortByStock: "Sắp xếp theo tồn kho",
    noProductsFound: "Không tìm thấy sản phẩm",
    noProductsInCategory: "Không có sản phẩm trong danh mục này",
    searchProducts: "Tìm kiếm sản phẩm...",
    scanBarcode: "Quét mã vạch",
    productScanned: "Đã quét sản phẩm",
    scanFailed: "Quét thất bại",
    productNotFound: "Không tìm thấy sản phẩm",
    addItemsToCart: "Thêm sản phẩm vào giỏ để bắt đầu",
    emptyCart: "Giỏ hàng trống",
    clearCart: "Xóa giỏ hàng",
    checkout: "Thanh toán",
    payment: "Thanh toán",
    cash: "Tiền mặt",
    card: "Thẻ",
    debitCard: "Thẻ ghi nợ",
    amountReceived: "Số tiền nhận",
    change: "Tiền thối",
    paymentMethod: "Phương thức thanh toán",
    orderComplete: "Đơn hàng hoàn tất",
    printReceipt: "In hóa đơn",
    newOrder: "+ Đơn mới",
    newTransaction: "Giao dịch mới",
    transactionComplete: "Giao dịch hoàn tất",
    transactionFailed: "Giao dịch thất bại",
    manageProducts: "Quản lý sản phẩm",
    productManager: "Quản lý sản phẩm",
    productName: "Tên sản phẩm",
    sku: "SKU",
    stock: "Tồn kho",
    imageUrl: "URL hình ảnh",
    isActive: "Hoạt động",
    addProductsToStart: "Thêm sản phẩm để bắt đầu",
    allProducts: "Tất cả sản phẩm",
    popular: "Phổ biến",
    lowStock: "Tồn kho thấp",
    stockCount: "Số lượng tồn kho",
    price: "Giá",
    category: "Danh mục",
    description: "Mô tả",
    barcode: "Mã vạch",
    costPrice: "Giá gốc",
    sellingPrice: "Giá bán",
    taxRate: "Thuế suất",
    discount: "Giảm giá",
    unit: "Đơn vị",
    supplier: "Nhà cung cấp",
    expiryDate: "Ngày hết hạn",
    batchNumber: "Số lô",
    location: "Vị trí",
    minStock: "Tồn kho tối thiểu",
    maxStock: "Tồn kho tối đa",
    reorderPoint: "Điểm đặt hàng lại",
    notes: "Ghi chú",
    addedToCartShort: "Đã thêm vào giỏ",
    hasBeenAddedToOrder: " đã được thêm vào đơn hàng",
    addedToOrderToast: " đã được thêm vào đơn hàng",
    receiptPreview: "Xem trước hóa đơn",
    cancel: "Hủy",
    confirmAndSelectPayment: "Xác nhận & Chọn thanh toán",
    thankYouBusiness: "Cảm ơn bạn đã mua hàng!",
    keepReceiptRecords: "Vui lòng giữ hóa đơn để làm bằng chứng",
    bulkImport: "Nhập hàng loạt",
    bulkImportTitle: "Nhập sản phẩm hàng loạt",
    bulkImportInstructions:
      "Tải tệp Excel, điền thông tin sản phẩm, sau đó tải lên để nhập sản phẩm.",
    downloadTemplate: "Tải xuống mẫu",
    fillProductInfo: "Điền thông tin sản phẩm",
    uploadAndPreview: "Tải lên & Xem trước",
    clickImportToComplete: "Nhấp để hoàn tất nhập",
    downloadTemplateButton: "Tải xuống mẫu",
    selectExcelFile: "Chọn tệp Excel",
    processing: "Đang xử lý",
    dataErrors: "Lỗi dữ liệu",
    dataPreview: "Xem trước dữ liệu",
    productsCount: "Số lượng sản phẩm",
    importProducts: "Nhập sản phẩm",
    importing: "Đang nhập",
    completedWithErrors: "Hoàn thành với lỗi",
    errorReportDownloaded: "Báo cáo lỗi đã được tải xuống",
    bulkImportSuccess: "Nhập hàng loạt thành công",
    bulkImportError: "Lỗi nhập hàng loạt",
    cannotReadFile: "Không thể đọc tệp",
    missingRequiredInfo: "Thiếu thông tin bắt buộc",
    productNameRequired: "Tên sản phẩm là bắt buộc",
    skuRequired: "SKU là bắt buộc",
    invalidPrice: "Giá không hợp lệ",
    invalidCategoryId: "ID danh mục không hợp lệ",
    invalidTaxRate: "Thuế suất không hợp lệ",
    duplicateSku: "SKU trùng lặp",
    productsSuccessful: "Sản phẩm nhập thành công",
    productsWithErrors: "Sản phẩm có lỗi",
    duplicateSkuCount: "Số lượng SKU trùng lặp",
    each: "mỗi cái",
    mainStoreLocation: "Vị trí cửa hàng chính",
    transactionNumber: "Số giao dịch:",
    date: "Ngày:",
    cashier: "Thu ngân:",
    subtotal: "Tạm tính:",
    tax: "Thuế:",
    total: "Tổng cộng:",
    paymentMethodLabel: "Phương thức thanh toán:",
    amountReceivedLabel: "Số tiền nhận:",
    phone: "Điện thoại:",

    // Printer configuration
    printerConfiguration: "Cấu hình máy in",
    addNewPrinter: "Thêm máy in mới",
    editPrinter: "Chỉnh sửa máy in",
    printerName: "Tên máy in",
    printerType: "Loại máy in",
    thermal: "Thermal (Nhiệt)",
    inkjet: "Inkjet (Phun mực)",
    laser: "Laser",
    connectionType: "Loại kết nối",
    network: "Mạng (Network)",
    bluetooth: "Bluetooth",
    ipAddress: "Địa chỉ IP",
    port: "Cổng (Port)",
    macAddress: "Địa chỉ MAC",
    employeePrinter: "Máy in nhân viên",
    kitchenPrinter: "Máy in bếp",
    inUse: "Đang sử dụng",
    addNew: "Thêm mới",
    update: "Cập nhật",
    printerList: "Danh sách máy in",
    printers: "máy in",
    off: "Tắt",
    test: "Test",
    edit: "Sửa",
    employee: "Nhân viên",
    kitchen: "Bếp",
    using: "Đang dùng",
    close: "Đóng",
    loading: "Đang tải...",
    noPrinterConfigs: "Chưa có cấu hình máy in nào",
    cancel: "Hủy",
    posLocation: "Vị trí POS",
    floor: "Tầng",
    zone: "Khu vực",
    
    // Additional Vietnamese POS keys
    quickSale: "Bán nhanh",
    multiplePayments: "Thanh toán đa phương thức",
    splitPayment: "Chia thanh toán",
    refund: "Hoàn tiền",
    exchange: "Đổi hàng",
    loyalty: "Khách hàng thân thiết",
    membercard: "Thẻ thành viên",
    giftCard: "Thẻ quà tặng",
    coupon: "Phiếu giảm giá",
    promotion: "Khuyến mãi",
    taxExempt: "Miễn thuế",
    taxInclusive: "Bao gồm thuế",
    priceOverride: "Ghi đè giá",
    discountOverride: "Ghi đè giảm giá",
    managerApproval: "Phê duyệt quản lý",
    verification: "Xác minh",
    authentication: "Xác thực",
    authorization: "Phân quyền",
    salesReport: "Báo cáo bán hàng",
    dailyReport: "Báo cáo ngày",
    shiftReport: "Báo cáo ca",
    cashierReport: "Báo cáo thu ngân",
    productReport: "Báo cáo sản phẩm",
    categoryReport: "Báo cáo danh mục",
    paymentReport: "Báo cáo thanh toán",
    customerReport: "Báo cáo khách hàng",
  },
};