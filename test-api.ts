const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const body = {
  model: 'z-image-turbo',
  input: {
    messages: [{ role: 'user', content: [{ text: 'a cat' }] }]
  },
  parameters: { prompt_extend: false, size: '1024*1024' }
};

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-ea5dd9d0002d456180d3d96842e3e417'
  },
  body: JSON.stringify(body)
});

console.log('Status:', res.status);
const text = await res.text();
console.log('Response:', text.slice(0, 500));

if (res.ok) {
  const json = JSON.parse(text);
  const imgUrl = json.output?.choices?.[0]?.message?.content?.[0]?.image;
  console.log('Image URL:', imgUrl);

  if (imgUrl) {
    const imgRes = await fetch(imgUrl);
    console.log('Image Status:', imgRes.status);
  }
}
