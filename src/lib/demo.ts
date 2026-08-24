import type { ContentType, CodeLanguage } from './types';

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

function paragraphs(prompt: string, count: number): string {
  const topic = prompt.trim() || 'your chosen topic';
  const intro = `In this article, we explore ${topic}. This is an important subject that affects many people and deserves careful consideration.`;
  const body = Array.from({ length: count - 1 }, (_, i) =>
    `Point ${i + 2}: ${lorem}`
  );
  return [intro, ...body, `In conclusion, ${topic} offers valuable insights and practical takeaways for anyone willing to engage with it deeply.`].join('\n\n');
}

export function generateDemoContent(
  type: ContentType,
  prompt: string,
  language?: CodeLanguage
): string {
  const p = prompt.trim() || 'the requested topic';
  switch (type) {
    case 'blog':
      return `# ${capitalize(p)}\n\n${paragraphs(p, 3)}`;
    case 'email':
      return `Subject: Regarding ${p}\n\nDear Recipient,\n\nI hope this message finds you well. I am writing to you about ${p}.\n\n${lorem}\n\nPlease let me know if you have any questions or would like to discuss further.\n\nBest regards,\nYour Name`;
    case 'social':
      return `Excited to share thoughts on ${p}! Here's why it matters and how you can get involved today. Drop a comment with your take. #${p.split(' ')[0] || 'topic'} #content`;
    case 'ad':
      return `HEADLINE: Discover ${p} Today!\n\n${lorem}\n\nCall to action: Sign up now and experience the difference.`;
    case 'product':
      return `${capitalize(p)}\n\n${lorem}\n\n- Feature 1: Reliable and efficient\n- Feature 2: Beautifully designed\n- Feature 3: Built to last\n\nOrder now and transform your experience.`;
    case 'code':
      return generateDemoCode(language ?? 'Python', p);
    default:
      return lorem;
  }
}

export function generateDemoCode(language: CodeLanguage, task: string): string {
  const t = task.trim() || 'the requested task';
  switch (language) {
    case 'Python':
      return `# ${capitalize(t)}\n# Python example (demo mode)\n\ndef solve(data):\n    """Return a processed result for the given data."""\n    result = [item * 2 for item in data]\n    return result\n\nif __name__ == "__main__":\n    sample = [1, 2, 3]\n    print(solve(sample))`;
    case 'JavaScript':
      return `// ${capitalize(t)}\n// JavaScript example (demo mode)\n\nfunction solve(data) {\n  return data.map((item) => item * 2);\n}\n\nconst sample = [1, 2, 3];\nconsole.log(solve(sample));`;
    case 'HTML':
      return `<!-- ${capitalize(t)} (demo mode) -->\n<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>Demo</title>\n  </head>\n  <body>\n    <h1>${t}</h1>\n    <p>An example HTML page.</p>\n  </body>\n</html>`;
    case 'CSS':
      return `/* ${capitalize(t)} (demo mode) */\nbody {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n  background: #fff0f6;\n  color: #1f2937;\n}\n.container {\n  max-width: 720px;\n  margin: 0 auto;\n  padding: 24px;\n}`;
    case 'Java':
      return `// ${capitalize(t)} (demo mode)\npublic class Main {\n    public static int[] solve(int[] data) {\n        int[] result = new int[data.length];\n        for (int i = 0; i < data.length; i++) {\n            result[i] = data[i] * 2;\n        }\n        return result;\n    }\n\n    public static void main(String[] args) {\n        int[] sample = {1, 2, 3};\n        System.out.println(java.util.Arrays.toString(solve(sample)));\n    }\n}`;
    case 'C#':
      return `// ${capitalize(t)} (demo mode)\nusing System;\n\nclass Program {\n    static int[] Solve(int[] data) {\n        int[] result = new int[data.Length];\n        for (int i = 0; i < data.Length; i++)\n            result[i] = data[i] * 2;\n        return result;\n    }\n\n    static void Main() {\n        int[] sample = { 1, 2, 3 };\n        Console.WriteLine(string.Join(", ", Solve(sample)));\n    }\n}`;
    case 'SQL':
      return `-- ${capitalize(t)} (demo mode)\nSELECT id, name, created_at\nFROM records\nWHERE status = 'active'\nORDER BY created_at DESC\nLIMIT 10;`;
    default:
      return `// ${t}`;
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const DEMO_IMAGE_SEEDS = [
  'sunset',
  'mountain',
  'ocean',
  'forest',
  'city',
  'desert',
  'garden',
  'aurora',
];

export function generateDemoImageUrl(
  prompt: string,
  aspectRatio: string
): string {
  const seed = encodeURIComponent(
    (prompt.trim().split(' ').slice(0, 3).join('-') ||
      DEMO_IMAGE_SEEDS[Math.floor(Math.random() * DEMO_IMAGE_SEEDS.length)]) +
      '-' +
      Math.floor(Math.random() * 100000)
  );
  let width = 1024;
  let height = 1024;
  if (aspectRatio.includes('16:9')) {
    width = 1280;
    height = 720;
  } else if (aspectRatio.includes('4:5')) {
    width = 800;
    height = 1000;
  }
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
