import OpenAI from "openai";

const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function clean(value, max = 3000) {
  return String(value ?? "").trim().slice(0, max);
}

function validateImages(images) {
  if (!Array.isArray(images)) return [];
  return images.slice(0, MAX_IMAGES).filter((image) => {
    if (!image || typeof image.dataUrl !== "string") return false;
    if (!/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image.dataUrl)) return false;
    const base64 = image.dataUrl.split(",")[1] || "";
    return Math.ceil(base64.length * 0.75) <= MAX_IMAGE_BYTES;
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 가능합니다." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "서버에 OPENAI_API_KEY가 설정되지 않았습니다." });
  }

  try {
    const body = req.body || {};
    const images = validateImages(body.images);

    const brief = {
      product: clean(body.product, 100),
      region: clean(body.region, 100),
      articleType: clean(body.articleType, 100),
      material: clean(body.material, 200),
      size: clean(body.size, 200),
      highlights: clean(body.highlights, 1000),
      notes: clean(body.notes, 4000),
      target: clean(body.target, 500),
      tone: clean(body.tone, 50) || "전문적이고 친절한 말투",
      length: clean(body.length, 30) || "보통",
      contact: clean(body.contact, 200),
      brand: "강동자바라"
    };

    if (!brief.product || !brief.notes) {
      return res.status(400).json({ error: "제품 종류와 작업 메모를 입력해 주세요." });
    }

    const instructions = `
당신은 대한민국 금속 구조물 맞춤 제작 업체 '강동자바라'의 네이버 블로그 전문 에디터다.
사용자가 제공한 현장 정보와 사진만 근거로 글을 작성한다. 확인되지 않은 시공 사실, 규격, 법령, 인증, 성능 수치, 지역 정보는 꾸며내지 않는다.

목표:
1. 네이버 검색에 적합한 자연스러운 SEO 글
2. AI 검색·답변 엔진이 핵심 내용을 쉽게 이해하고 인용할 수 있는 GEO 구조
3. 실제 제조·상담 경험이 드러나는 신뢰도 높은 문장
4. 키워드 도배, 과장, 반복, 경쟁사 비방 금지

작성 원칙:
- 첫 문단에서 현장·제품·고객 고민에 바로 답한다.
- 제목에는 핵심 제품명과 지역을 자연스럽게 포함하되 낚시성 표현은 피한다.
- H2 수준 소제목을 5~8개 사용한다.
- 사진이 있으면 사진 순서대로 관찰 가능한 내용만 설명하고, 각 사진 설명은 1~2문장으로 만든다.
- 실제 규격·재질·제작 목적을 구체적으로 반영한다.
- FAQ 3~5개를 질문과 명확한 답변 형식으로 작성한다.
- 마지막에 강동자바라 상담 유도 문구를 넣되 과도한 판매 문구는 피한다.
- 전체 글은 한국어로 쓴다.

반드시 아래 JSON 구조로만 응답한다. 마크다운 코드블록은 사용하지 않는다.
{
  "titles": ["제목1", "제목2", "제목3", "제목4", "제목5"],
  "primaryKeyword": "핵심키워드",
  "relatedKeywords": ["연관키워드1", "연관키워드2"],
  "summary": "검색결과나 AI 요약에 적합한 2~3문장 요약",
  "body": "네이버 블로그에 바로 붙여넣을 수 있는 전체 본문",
  "photoCaptions": ["사진1 설명", "사진2 설명"],
  "faq": [{"question":"질문", "answer":"답변"}],
  "hashtags": ["#해시태그1", "#해시태그2"],
  "shortPost": "인스타그램이나 짧은 홍보글용 요약",
  "qualityChecks": ["확인 또는 보완이 필요한 정보"]
}`;

    const content = [
      {
        type: "input_text",
        text: `다음 정보로 블로그 글을 작성해 주세요.\n\n${JSON.stringify(brief, null, 2)}\n\n사진 수: ${images.length}장`
      },
      ...images.map((image, index) => ({
        type: "input_image",
        image_url: image.dataUrl,
        detail: "auto"
      }))
    ];

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions,
      input: [{ role: "user", content }],
      store: false
    });

    const text = response.output_text?.trim();
    if (!text) throw new Error("AI 응답이 비어 있습니다.");

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("AI 응답을 JSON으로 변환하지 못했습니다.");
      parsed = JSON.parse(match[0]);
    }

    return res.status(200).json({ result: parsed });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || "글 생성 중 오류가 발생했습니다." });
  }
}
