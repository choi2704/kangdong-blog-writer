# 강동자바라 블로그 작성기

사진과 작업 메모를 입력하면 네이버 블로그용 SEO·GEO 원고를 생성하는 사내용 웹 프로그램입니다.

## 주요 기능
- 현장 사진 최대 8장 분석
- 제목 5개 생성
- 네이버 블로그 전체 본문 생성
- 사진별 설명 문구
- FAQ, 핵심 키워드, 연관 키워드, 해시태그
- 인스타그램·짧은 홍보글
- 항목별 복사 버튼

## 설치 및 배포
이 프로젝트는 API 키 보호를 위해 GitHub Pages 단독 사용이 아니라 Vercel 같은 서버리스 환경을 사용합니다.

1. GitHub에 새 저장소를 만들고 이 폴더의 파일을 업로드합니다.
2. Vercel에서 해당 GitHub 저장소를 Import합니다.
3. Vercel 프로젝트의 Settings → Environment Variables에서 다음을 등록합니다.
   - `OPENAI_API_KEY`: OpenAI API 키
   - `OPENAI_MODEL`: `gpt-5` 권장
4. Deploy를 누릅니다.

## 로컬 실행
```bash
npm install
cp .env.example .env.local
npm run dev
```

## 주의
- API 키를 index.html이나 GitHub 공개 저장소에 직접 넣으면 안 됩니다.
- 사진과 작업 내용은 AI 처리에 전송되므로 고객 개인정보, 차량번호, 얼굴 등은 필요할 때 가린 후 올리는 것을 권장합니다.
- 생성된 규격, 법령, 성능 수치는 게시 전에 확인하세요.
