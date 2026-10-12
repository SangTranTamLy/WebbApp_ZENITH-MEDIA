# MDA Reports

Đây là thư mục đầu ra chính thức cho các báo cáo knowledge của MDA.

## Cấu trúc chuẩn

```text
reports/
├── word/
│   ├── 01-chatbot/
│   ├── 02-portfolio-code/
│   ├── 03-portfolio-media/
│   ├── 04-adobe/
│   ├── 05-editing-methods/
│   ├── 06-community/
│   └── 07-source-register/
└── pdf/
    ├── 01-chatbot/
    ├── 02-portfolio-code/
    ├── 03-portfolio-media/
    ├── 04-adobe/
    ├── 05-editing-methods/
    ├── 06-community/
    └── 07-source-register/
```

Không đưa dữ liệu thô, secret, token, crack hoặc file chưa được Sang xác nhận vào đây. Prompt điều phối bắt buộc nằm tại:

`apps/ai/mda/prompts/mda-report-orchestrator-prompt.md`

Mọi lần tạo/cập nhật báo cáo phải có xác nhận rõ ràng của Sang trước khi ghi file.

