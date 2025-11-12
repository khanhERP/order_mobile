export const purchasesTranslations = {
  ko: {
    // Dashboard & Overview
    title: "구매 관리",
    dashboard: "구매 대시보드",
    overview: "개요",
    newPurchaseOrder: "새 구매 주문",
    searchPurchaseOrders: "구매 주문 검색",

    // Purchase Order Management
    purchaseOrder: "구매 주문",
    purchaseOrders: "구매 주문",
    piNumber: "PI 번호",
    createPurchaseOrder: "구매 주문 생성",
    createOrder: "주문 생성",
    editPurchaseOrder: "구매 주문 편집",
    deletePurchaseOrder: "구매 주문 삭제",
    purchaseDate: "구매일",
    purchaseType: "구매 형태",
    selectPurchaseType: "구매 형태를 선택하세요",
    duplicatePurchaseOrder: "구매 주문 복사",
    onTime: "정시",
    rating: "평점",

    // Purchase Order Details
    orderDate: "주문일",
    expectedDate: "예상일",
    expectedDelivery: "예상 배송일",
    actualDelivery: "실제 배송일",
    supplier: "공급업체",
    supplierName: "공급업체명",
    supplierContact: "공급업체 연락처",
    deliveryAddress: "배송 주소",
    notes: "메모",
    internalNotes: "내부 메모",
    purchaseDate: "구매일",

    // Status Management
    status: "상태",
    pending: "대기",
    confirmed: "확인됨",
    ordered: "주문됨",
    partially_received: "부분 수령",
    received: "수령 완료",
    cancelled: "취소됨",
    overdue: "연체됨",

    // Status Display Names
    statusPending: "대기중",
    statusApproved: "승인됨",
    statusOrdered: "주문됨",
    statusDelivered: "배송됨",
    statusCompleted: "완료",
    statusCancelled: "취소",

    // Items Management
    items: "품목",
    itemDetails: "품목 상세",
    addItem: "품목 추가",
    removeItem: "품목 제거",
    product: "제품",
    productName: "제품명",
    sku: "SKU",
    description: "설명",
    unitPrice: "단가",
    quantity: "수량",
    orderedQuantity: "주문 수량",
    receivedQuantity: "입고 수량",
    remainingQuantity: "잔여 수량",
    totalAmount: "총 금액",
    itemsDescription: "구매 주문에 포함된 품목 목록",

    // Pricing & Calculations
    subtotal: "소계",
    tax: "세금",
    taxRate: "세율",
    discount: "할인",
    shippingCost: "배송비",
    totalCost: "총 비용",

    // Receive Goods
    receiveGoods: "물품 입고",
    receiveItems: "품목 입고",
    receiveAll: "전체 입고",
    partialReceipt: "부분 입고",
    receiptDate: "입고일",
    receivedBy: "입고 담당자",
    qualityCheck: "품질 검사",
    damageReport: "손상 신고",

    // Documents & Files
    documents: "문서",
    attachments: "첨부파일",
    uploadDocument: "문서 업로드",
    deleteDocument: "문서 삭제",
    downloadDocument: "문서 다운로드",
    invoice: "송장",
    deliveryNote: "배송장",
    packingList: "포장 목록",
    certificate: "인증서",

    // Search & Filters
    filterBy: "필터링",
    filterByStatus: "상태별 필터",
    filterBySupplier: "공급업체별 필터",
    filterByDate: "날짜별 필터",
    dateRange: "기간",
    fromDate: "시작일",
    toDate: "종료일",
    searchPlaceholder: "주문 번호 또는 공급업체명으로 검색...",
    allStatuses: "모든 상태",
    allSuppliers: "모든 공급업체",

    // Actions
    view: "보기",
    edit: "편집",
    delete: "삭제",
    duplicate: "복사",
    approve: "승인",
    reject: "거절",
    cancel: "취소",
    save: "저장",
    submit: "제출",
    confirm: "확인",
    actions: "작업",

    // Notifications & Messages
    orderCreated: "구매 주문이 생성되었습니다",
    orderUpdated: "구매 주문이 업데이트되었습니다",
    orderDeleted: "구매 주문이 삭제되었습니다",
    orderCancelled: "구매 주문이 취소되었습니다",
    goodsReceived: "물품이 입고되었습니다",
    inventoryUpdated: "재고가 업데이트되었습니다",
    documentUploaded: "문서가 업로드되었습니다",

    // Errors
    orderNotFound: "구매 주문을 찾을 수 없습니다",
    supplierRequired: "공급업체를 선택해주세요",
    itemsRequired: "최소 1개의 품목이 필요합니다",
    invalidQuantity: "올바른 수량을 입력해주세요",
    exceededQuantity: "입고 수량이 주문 수량을 초과합니다",
    uploadFailed: "문서 업로드에 실패했습니다",

    // Statistics
    totalOrders: "총 주문수",
    pendingOrders: "대기 중인 주문",
    completedOrders: "완료된 주문",
    totalValue: "총 주문 금액",
    averageOrderValue: "평균 주문 금액",
    topSuppliers: "주요 공급업체",

    // Dashboard Statistics Details
    ordersThisMonth: "이번 달 주문",
    awaitingApproval: "승인 대기중",
    fullyReceived: "완전히 받음",
    totalSpent: "총 지출 금액",

    // Export & Reports
    exportToExcel: "엑셀로 내보내기",
    exportToPDF: "PDF로 내보내기",
    printOrder: "주문서 인쇄",
    purchaseReport: "구매 보고서",
    supplierReport: "공급업체 보고서",

    // Navigation & UI
    backToList: "목록으로 돌아가기",
    previousPage: "이전 페이지",
    nextPage: "다음 페이지",
    itemsPerPage: "페이지당 항목 수",
    noOrders: "구매 주문이 없습니다",
    noOrdersFound: "검색 조건에 맞는 주문이 없습니다",
    noItems: "품목이 없습니다",
    loading: "로딩 중...",
    loadingOrders: "주문을 불러오는 중...",
    ordersFound: "개의 주문을 찾았습니다",
    createFirstOrder: "첫 번째 구매 주문을 생성하여 시작하세요",
    tryDifferentFilters: "다른 필터를 시도해보세요",

    // Advanced Features
    recurring: "정기 주문",
    template: "템플릿",
    approval: "승인",
    workflow: "워크플로우",
    reminder: "알림",
    notification: "알림",

    unknownSupplier: "알 수 없는 공급업체",

    // Purchase Form specific translations
    orderDetails: "주문 상세정보",
    orderDetailsDescription: "구매 주문의 기본 정보를 입력하세요",
    selectSupplier: "공급업체를 선택하세요",
    poNumberPlaceholder: "PO 번호를 입력하세요",
    notesPlaceholder: "메모나 특별 지시사항을 입력하세요",
    orderSummary: "주문 요약",
    selectProducts: "상품 선택",
    selectProductsDescription: "주문할 상품을 선택하세요",
    searchProducts: "상품 검색",
    noItemsSelected: "선택된 상품이 없습니다",
    clickAddItemToStart: "'상품 추가' 버튼을 클릭해서 시작하세요",
    totalQuantity: "총 수량",
    createOrderDescription: "새로운 구매 주문을 작성합니다",
    editOrderDescription: "기존 구매 주문을 수정합니다",

    // Purchase Types
    rawMaterials: "원자재",
    expenses: "비용",
    others: "기타",

    // File Attachments
    attachDocuments: "증빙자료 첨부",
    attachDocumentsDescription: "PDF, 이미지 등의 파일을 첨부하세요",

    // File Upload UI
    dragOrClickToUpload: "파일을 드래그하거나 클릭하여 업로드",
    maxFileSize: "PDF, 이미지, 문서 (최대 10MB)",
    attachedFiles: "첨부된 파일",
    fileDescription: "파일 설명 (선택사항)",
    uploadingFiles: "파일 업로드 중...",
    unsupportedFileType: "지원되지 않는 파일 형식입니다.",
    fileSizeExceeded: "파일 크기는 10MB를 초과할 수 없습니다.",

    // Purchase receipts
    purchaseReceipts: "구매 입고 전표",
    purchaseReceiptsList: "구매 입고 목록",

    // Sales orders (for sales-orders page)
    salesOrdersList: "판매 주문 목록",

    // Table headers for purchase form
    unit: "단위",
    discountPercent: "할인율",
    discountAmount: "할인액",
    subtotalAmount: "소계",
    rowNumber: "STT",
    createNewPurchaseOrder: "새 구매 입고 생성",

    // Filter labels
    fromDateLabel: "시작일",
    toDateLabel: "종료일",
    productLabel: "상품",
    generalSearchLabel: "일반 검색",

    // Form labels
    poNumber: "PO 번호",
    assignedTo: "담당자",
    selectEmployee: "직원 선택",
    receiptNumber: "입고 번호",

    // Delete functionality
    deleteSelected: "선택 항목 삭제",
    confirmDelete: "삭제 확인",
    confirmDeleteMessage: "개의 구매 입고 전표를 삭제하시겠습니까?",
    deleteSuccess: "개의 구매 입고 전표가 성공적으로 삭제되었습니다",
    deleteFailed: "구매 입고 전표 삭제에 실패했습니다",
  },

  en: {
    // Dashboard & Overview
    title: "입고 전표",
    dashboard: "Purchase Dashboard",
    overview: "Overview",
    newPurchaseOrder: "New Purchase Order",
    searchPurchaseOrders: "Search Purchase Orders",

    // Purchase Order Management
    purchaseOrder: "Purchase Order",
    purchaseOrders: "Purchase Orders",
    piNumber: "PI Number",
    createPurchaseOrder: "Create Purchase Order",
    createOrder: "Create Order",
    editPurchaseOrder: "Edit Purchase Order",
    deletePurchaseOrder: "Delete Purchase Order",
    purchaseDate: "Purchase Date",
    purchaseType: "Purchase Type",
    selectPurchaseType: "Select purchase type",
    duplicatePurchaseOrder: "Duplicate Purchase Order",
    onTime: "On Time",
    rating: "Rating",

    // Purchase Order Details
    orderDate: "Order Date",
    expectedDate: "Expected Date",
    expectedDelivery: "Expected Delivery",
    actualDelivery: "Actual Delivery",
    supplier: "Supplier",
    supplierName: "Supplier Name",
    supplierContact: "Supplier Contact",
    deliveryAddress: "Delivery Address",
    notes: "Notes",
    internalNotes: "Internal Notes",
    expectedDeliveryDate: "Expected Delivery Date",

    // Status Management
    status: "Status",
    pending: "Pending",
    confirmed: "Confirmed",
    ordered: "Ordered",
    partially_received: "Partially Received",
    received: "Received",
    cancelled: "Cancelled",
    overdue: "Overdue",

    // Status Display Names
    statusPending: "Pending",
    statusApproved: "Approved",
    statusOrdered: "Ordered",
    statusDelivered: "Delivered",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",

    // Items Management
    items: "Items",
    itemDetails: "Item Details",
    addItem: "Add Item",
    removeItem: "Remove Item",
    product: "Product",
    productName: "Product Name",
    sku: "SKU",
    description: "Description",
    unitPrice: "Unit Price",
    quantity: "Quantity",
    orderedQuantity: "Ordered Quantity",
    receivedQuantity: "Received Quantity",
    remainingQuantity: "Remaining Quantity",
    totalAmount: "Total Amount",
    itemsDescription: "List of items included in the purchase order",

    // Pricing & Calculations
    subtotal: "Subtotal",
    tax: "Tax",
    taxRate: "Tax Rate",
    discount: "Discount",
    shippingCost: "Shipping Cost",
    totalCost: "Total Cost",

    // Receive Goods
    receiveGoods: "Receive Goods",
    receiveItems: "Receive Items",
    receiveAll: "Receive All",
    partialReceipt: "Partial Receipt",
    receiptDate: "Receipt Date",
    receivedBy: "Received By",
    qualityCheck: "Quality Check",
    damageReport: "Damage Report",

    // Documents & Files
    documents: "Documents",
    attachments: "Attachments",
    uploadDocument: "Upload Document",
    deleteDocument: "Delete Document",
    downloadDocument: "Download Document",
    invoice: "Invoice",
    deliveryNote: "Delivery Note",
    packingList: "Packing List",
    certificate: "Certificate",

    // Search & Filters
    filterBy: "Filter By",
    filterByStatus: "Filter by Status",
    filterBySupplier: "Filter by Supplier",
    filterByDate: "Filter by Date",
    dateRange: "Date Range",
    fromDate: "From Date",
    toDate: "To Date",
    searchPlaceholder: "Search by PO number or supplier name...",
    allStatuses: "All Statuses",
    allSuppliers: "All Suppliers",

    // Actions
    view: "View",
    edit: "Edit",
    delete: "Delete",
    duplicate: "Duplicate",
    approve: "Approve",
    reject: "Reject",
    cancel: "Cancel",
    save: "Save",
    submit: "Submit",
    confirm: "Confirm",
    actions: "Actions",

    // Notifications & Messages
    orderCreated: "Purchase order created successfully",
    orderUpdated: "Purchase order updated successfully",
    orderDeleted: "Purchase order deleted successfully",
    orderCancelled: "Purchase order cancelled",
    goodsReceived: "Goods received successfully",
    inventoryUpdated: "Inventory updated successfully",
    documentUploaded: "Document uploaded successfully",

    // Errors
    orderNotFound: "Purchase order not found",
    supplierRequired: "Please select a supplier",
    itemsRequired: "At least one item is required",
    invalidQuantity: "Please enter a valid quantity",
    exceededQuantity: "Received quantity exceeds ordered quantity",
    uploadFailed: "Document upload failed",

    // Statistics
    totalOrders: "Total Orders",
    pendingOrders: "Pending Orders",
    completedOrders: "Completed Orders",
    totalValue: "Total Order Value",
    averageOrderValue: "Average Order Value",
    topSuppliers: "Top Suppliers",

    // Dashboard Statistics Details
    ordersThisMonth: "Orders This Month",
    awaitingApproval: "Awaiting Approval",
    fullyReceived: "Fully Received",
    totalSpent: "Total Spent",

    // Export & Reports
    exportToExcel: "Export to Excel",
    exportToPDF: "Export to PDF",
    printOrder: "Print Order",
    purchaseReport: "Purchase Report",
    supplierReport: "Supplier Report",

    // Navigation & UI
    backToList: "Back to List",
    previousPage: "Previous Page",
    nextPage: "Next Page",
    itemsPerPage: "Items per Page",
    noOrders: "No purchase orders found",
    noOrdersFound: "No orders match your search criteria",
    noItems: "No items found",
    loading: "Loading...",
    loadingOrders: "Loading purchase orders...",
    ordersFound: "orders found",
    createFirstOrder: "Create your first purchase order to get started",
    tryDifferentFilters: "Try different filters or search terms",

    // Advanced Features
    recurring: "Recurring Order",
    template: "Template",
    approval: "Approval",
    workflow: "Workflow",
    reminder: "Reminder",
    notification: "Notification",

    unknownSupplier: "Unknown Supplier",

    // Purchase Form specific translations
    orderDetails: "Order Details",
    orderDetailsDescription: "Enter basic information for the purchase order",
    selectSupplier: "Select a supplier",
    poNumberPlaceholder: "Enter PO number",
    notesPlaceholder: "Enter notes or special instructions",
    orderSummary: "Order Summary",
    selectProducts: "Select Products",
    selectProductsDescription: "Choose products to order",
    searchProducts: "Search products",
    noItemsSelected: "No items selected",
    clickAddItemToStart: "Click 'Add Item' button to start",
    totalQuantity: "Total Quantity",
    createOrderDescription: "Create a new purchase order",
    editOrderDescription: "Edit existing purchase order",

    // Purchase Types
    rawMaterials: "Raw Materials",
    expenses: "Expenses",
    others: "Others",

    // File Attachments
    attachDocuments: "Attach Supporting Documents",
    attachDocumentsDescription: "Attach files such as PDF, images, etc.",

    // File Upload UI
    dragOrClickToUpload: "Drag files or click to upload",
    maxFileSize: "PDF, images, documents (max 10MB)",
    attachedFiles: "Attached Files",
    fileDescription: "File description (optional)",
    uploadingFiles: "Uploading files...",
    unsupportedFileType: "Unsupported file type.",
    fileSizeExceeded: "File size cannot exceed 10MB.",

    // Purchase receipts
    purchaseReceipts: "Purchase Receipts",
    purchaseReceiptsList: "Purchase Receipts List",

    // Sales orders (for sales-orders page)
    salesOrdersList: "Sales Orders List",

    // Table headers for purchase form
    unit: "Unit",
    discountPercent: "Discount %",
    discountAmount: "Discount Amount",
    subtotalAmount: "Subtotal",
    rowNumber: "No",
    createNewPurchaseOrder: "Create Purchase Receipt",

    // Filter labels
    fromDateLabel: "From Date",
    toDateLabel: "To Date",
    productLabel: "Product",
    generalSearchLabel: "General Search",

    // Form labels
    poNumber: "PO Number",
    assignedTo: "Assigned To",
    selectEmployee: "Select Employee",
    receiptNumber: "Receipt Number",

    // Delete functionality
    deleteSelected: "Delete Selected",
    confirmDelete: "Confirm Delete",
    confirmDeleteMessage: "purchase receipts?",
    deleteSuccess: "purchase receipts deleted successfully",
    deleteFailed: "Failed to delete purchase receipts",
  },

  vi: {
    // Dashboard & Overview
    title: "Danh sách phiếu nhập hàng",
    dashboard: "Bảng điều khiển Mua hàng",
    overview: "Tổng quan",
    newPurchaseOrder: "Tạo mới",
    searchPurchaseOrders: "Tìm kiếm phiếu nhập hàng",

    // Purchase Order Management
    purchaseOrder: "Phiếu nhập hàng",
    purchaseOrders: "Phiếu nhập hàng",
    piNumber: "Số PI",
    createPurchaseOrder: "Tạo phiếu nhập hàng",
    createOrder: "Tạo phiếu nhập",
    editPurchaseOrder: "Chỉnh sửa phiếu nhập hàng",
    deletePurchaseOrder: "Xóa phiếu nhập hàng",
    purchaseDate: "Ngày nhập",
    purchaseType: "Loại mua hàng",
    selectPurchaseType: "Chọn loại mua hàng",
    duplicatePurchaseOrder: "Sao chép phiếu nhập hàng",
    viewPurchaseOrder: "Xem phiếu nhập hàng",
    viewOrderDescription: "Xem chi tiết phiếu nhập hàng",
    onTime: "Đúng giờ",
    rating: "Đánh giá",

    // Purchase Order Details
    orderDate: "Ngày đặt hàng",
    expectedDate: "Ngày dự kiến",
    expectedDelivery: "Giao hàng dự kiến",
    actualDelivery: "Giao hàng thực tế",
    supplier: "Nhà cung cấp",
    supplierName: "Tên nhà cung cấp",
    supplierContact: "Liên hệ nhà cung cấp",
    deliveryAddress: "Địa chỉ giao hàng",
    notes: "Ghi chú",
    internalNotes: "Ghi chú nội bộ",
    expectedDeliveryDate: "Ngày giao hàng dự kiến",

    // Status Management
    status: "Trạng thái",
    pending: "Đang chờ",
    confirmed: "Đã xác nhận",
    ordered: "Đã đặt hàng",
    partially_received: "Nhận một phần",
    received: "Đã nhận",
    cancelled: "Đã hủy",
    overdue: "Quá hạn",

    // Status Display Names
    statusPending: "Đang chờ",
    statusApproved: "Đã duyệt",
    statusOrdered: "Đã đặt hàng",
    statusDelivered: "Đã giao",
    statusCompleted: "Hoàn thành",
    statusCancelled: "Đã hủy",

    // Items Management
    items: "Mặt hàng",
    itemDetails: "Chi tiết mặt hàng",
    addItem: "Thêm mặt hàng",
    removeItem: "Xóa mặt hàng",
    product: "Sản phẩm",
    productName: "Tên sản phẩm",
    sku: "SKU",
    description: "Mô tả",
    unitPrice: "Đơn giá",
    quantity: "Số lượng",
    unit: "Đơn vị tính",
    orderedQuantity: "Số lượng đặt",
    receivedQuantity: "Số lượng nhận",
    remainingQuantity: "Số lượng còn lại",
    totalAmount: "Tổng tiền",
    itemsDescription: "Danh sách các mặt hàng trong đơn mua hàng",

    // Pricing & Calculations
    subtotal: "Tạm tính",
    tax: "Thuế",
    taxRate: "Thuế suất",
    discount: "Giảm giá",
    shippingCost: "Phí vận chuyển",
    totalCost: "Tổng chi phí",

    // Receive Goods
    receiveGoods: "Nhận hàng",
    receiveItems: "Nhận mặt hàng",
    receiveAll: "Nhận tất cả",
    partialReceipt: "Nhận một phần",
    receiptDate: "Ngày nhận",
    receivedBy: "Người nhận",
    qualityCheck: "Kiểm tra chất lượng",
    damageReport: "Báo cáo hư hỏng",

    // Documents & Files
    documents: "Tài liệu",
    attachments: "Tệp đính kèm",
    uploadDocument: "Tải lên tài liệu",
    deleteDocument: "Xóa tài liệu",
    downloadDocument: "Tải xuống tài liệu",
    invoice: "Hóa đơn",
    deliveryNote: "Phiếu giao hàng",
    packingList: "Danh sách đóng gói",
    certificate: "Chứng chỉ",

    // Search & Filters
    filterBy: "Lọc theo",
    filterByStatus: "Lọc theo trạng thái",
    filterBySupplier: "Lọc theo nhà cung cấp",
    filterByDate: "Lọc theo ngày",
    dateRange: "Khoảng thời gian",
    fromDate: "Từ ngày",
    toDate: "Đến ngày",
    searchPlaceholder: "Tìm theo số PO hoặc tên nhà cung cấp...",
    allStatuses: "Tất cả trạng thái",
    allSuppliers: "Tất cả nhà cung cấp",

    // Actions
    view: "Xem",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    duplicate: "Sao chép",
    approve: "Duyệt",
    reject: "Từ chối",
    cancel: "Hủy",
    save: "Lưu",
    submit: "Gửi",
    confirm: "Xác nhận",
    actions: "Hành động",

    // Notifications & Messages
    orderCreated: "Đã tạo đơn mua hàng thành công",
    orderUpdated: "Đã cập nhật đơn mua hàng thành công",
    orderDeleted: "Đã xóa đơn mua hàng thành công",
    orderCancelled: "Đã hủy đơn mua hàng",
    goodsReceived: "Đã nhận hàng thành công",
    inventoryUpdated: "Đã cập nhật tồn kho thành công",
    documentUploaded: "Đã tải lên tài liệu thành công",

    // Errors
    orderNotFound: "Không tìm thấy đơn mua hàng",
    supplierRequired: "Vui lòng chọn nhà cung cấp",
    itemsRequired: "Cần có ít nhất một mặt hàng",
    invalidQuantity: "Vui lòng nhập số lượng hợp lệ",
    exceededQuantity: "Số lượng nhận vượt quá số lượng đặt",
    uploadFailed: "Tải lên tài liệu thất bại",

    // Statistics
    totalOrders: "Tổng số đơn",
    pendingOrders: "Đơn đang chờ",
    completedOrders: "Đơn hoàn thành",
    totalValue: "Tổng giá trị đơn hàng",
    averageOrderValue: "Giá trị trung bình mỗi đơn",
    topSuppliers: "Nhà cung cấp hàng đầu",

    // Dashboard Statistics Details
    ordersThisMonth: "Đơn hàng tháng này",
    awaitingApproval: "Chờ phê duyệt",
    fullyReceived: "Đã nhận đủ",
    totalSpent: "Tổng chi tiêu",

    // Export & Reports
    exportToExcel: "Xuất ra Excel",
    exportToPDF: "Xuất ra PDF",
    printOrder: "In đơn hàng",
    purchaseReport: "Báo cáo mua hàng",
    supplierReport: "Báo cáo nhà cung cấp",

    // Navigation & UI
    backToList: "Quay lại danh sách",
    previousPage: "Trang trước",
    nextPage: "Trang sau",
    itemsPerPage: "Số mục trên trang",
    noOrders: "Không tìm thấy đơn mua hàng",
    noOrdersFound: "Không có đơn hàng nào khớp với tiêu chí tìm kiếm",
    noItems: "Không tìm thấy mặt hàng",
    loading: "Đang tải...",
    loadingOrders: "Đang tải đơn mua hàng...",
    ordersFound: "đơn hàng được tìm thấy",
    createFirstOrder: "Tạo đơn mua hàng đầu tiên để bắt đầu",
    tryDifferentFilters: "Thử các bộ lọc hoặc từ khóa tìm kiếm khác",

    // Advanced Features
    recurring: "Đơn hàng định kỳ",
    template: "Mẫu",
    approval: "Duyệt",
    workflow: "Quy trình",
    reminder: "Nhắc nhở",
    notification: "Thông báo",

    unknownSupplier: "Nhà cung cấp không xác định",

    // Purchase Form specific translations
    orderDetails: "Chi tiết phiếu nhập",
    orderDetailsDescription: "Nhập thông tin cơ bản cho phiếu nhập hàng",
    selectSupplier: "Chọn nhà cung cấp",
    poNumberPlaceholder: "Nhập số PO",
    notesPlaceholder: "Nhập ghi chú hoặc hướng dẫn đặc biệt",
    orderSummary: "Tóm tắt phiếu nhập",
    selectProducts: "Chọn sản phẩm",
    selectProductsDescription: "Chọn sản phẩm để đặt hàng",
    searchProducts: "Tìm kiếm sản phẩm",
    noItemsSelected: "Không có mục nào được chọn",
    clickAddItemToStart: "Nhấp vào nút 'Thêm mục' để bắt đầu",
    totalQuantity: "Tổng số lượng",
    createOrderDescription: "Tạo phiếu nhập hàng mới",
    editOrderDescription: "Chỉnh sửa phiếu nhập hàng hiện tại",

    // Purchase Types
    rawMaterials: "Nguyên liệu thô",
    expenses: "Chi phí",
    others: "Khác",

    // File Attachments
    attachDocuments: "Đính kèm tài liệu chứng minh",
    attachDocumentsDescription: "Đính kèm các file như PDF, hình ảnh, v.v.",

    // File Upload UI
    dragOrClickToUpload: "Kéo thả file hoặc nhấp để tải lên",
    maxFileSize: "PDF, hình ảnh, tài liệu (tối đa 10MB)",
    attachedFiles: "File đã đính kèm",
    fileDescription: "Mô tả file (tùy chọn)",
    uploadingFiles: "Đang tải file lên...",
    unsupportedFileType: "Loại file không được hỗ trợ.",
    fileSizeExceeded: "Kích thước file không được vượt quá 10MB.",

    // Purchase receipts
    purchaseReceipts: "Phiếu nhập hàng",
    purchaseReceiptsList: "Danh sách phiếu nhập hàng",

    // Sales orders (for sales-orders page)
    salesOrdersList: "Danh sách đơn hàng bán",

    // Table headers for purchase form
    unit: "Đơn vị",
    discountPercent: "% CK",
    discountAmount: "Chiết khấu",
    subtotalAmount: "Thành tiền",
    rowNumber: "STT",
    createNewPurchaseOrder: "Tạo phiếu nhập",

    // Filter labels
    fromDateLabel: "Từ ngày",
    toDateLabel: "Đến ngày",
    productLabel: "Sản phẩm",
    generalSearchLabel: "Tìm kiếm tổng quát",

    // Form labels
    poNumber: "Số phiếu nhập",
    assignedTo: "Người phụ trách",
    selectEmployee: "Chọn nhân viên",
    receiptNumber: "Số phiếu nhập",

    // Delete functionality
    deleteSelected: "Xóa phiếu nhập",
    confirmDelete: "Xác nhận xóa",
    confirmDeleteMessage: "phiếu nhập hàng?",
    deleteSuccess: "phiếu nhập hàng đã được xóa thành công",
    deleteFailed: "Không thể xóa phiếu nhập hàng",
  }
};