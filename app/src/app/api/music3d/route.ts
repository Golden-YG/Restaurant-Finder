import OpenAI from 'openai';

export const runtime = 'nodejs';

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`Missing required env var: ${name}`);
	}
	return value;
}

async function callOpenAIAudioAnalysis(audioBase64: string, audioFormat: string, userNotes: string): Promise<string> {
	const openai = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY') });

	const prompt = `Role You are a Music-to-3D Design Assistant. Your job is to analyze an uploaded MP3 plus my written impressions, then produce: A) a clear, concise design description of a single 3D object B) a Meshy-ready parameter block to generate a 3D prototype
Objectives
Translate musical features (tempo, key/mode, timbre, dynamics, structure, mood) and my imagination notes into a coherent 3D form factor
Deliver unambiguous, production-ready guidance: precise shapes, materials, colors (HEX), scale, and constraints
Output must be immediately usable in Meshy (UI or API) with a clean prompt and structured settings
Inputs (I will provide)
MP3: [I will attach the file]
My notes (feelings, imagery, intended use or audience, constraints): ${userNotes || '[none provided]'}
Optional practical constraints: target size, budget/material limits, safety/ergonomic concerns, IP/brand avoidance
Process
Audio feature extraction (approximate is fine)

Tempo (BPM), meter; key/mode; dominant instruments/timbres
Energy curve and dynamics across the track
Structure with timestamps (intro, verse/chorus/bridge, drops, outro)
Mood/emotion tags; notable motifs; spatial feel (wide/close, bright/dark)
Meaning synthesis (align with my notes)

Extract design drivers from my text: nouns (things), verbs (actions), adjectives (qualities), metaphors/symbols
Resolve conflicts by ranking drivers; state any necessary assumptions explicitly
Music → Form mapping

Rhythm → pattern repetition, segmentation, ridges/grooves
Melody/harmony → silhouette flow, curvature vs. angularity, symmetry
Timbre → material cues (metal/glass/wood/fabric), surface finish (matte/satin/gloss), micro-texture
Dynamics → contrast zones, thickness, edge sharpness, openings/vents
Mood/color → palette with HEX, emissive accents if applicable
Space/energy → massing, negative space, stance/orientation; suggest camera/lighting for presentation
Meshy parameterization

Produce a tight, 100–220 word “Prompt” focused on the final object, not process
Use a “Negative prompt” to avoid defects (e.g., low-detail, text, logos, extra parts, asymmetry if not desired)
Choose style preset; set symmetry axis; topology preference; polycount target; texture resolution; PBR maps
Provide material hints, color palette, lighting setup, camera preset, and real-world scale
If any setting is not supported by the user’s Meshy workflow, include it as a note; do not omit critical intent
Output format (use exactly these sections and structure)
Music Analysis (concise)
Tempo: [BPM], Meter: [e.g., 4/4], Key/Mode: [e.g., A minor]
Dominant timbres/instruments: [...]
Energy & dynamics: [one-line trend], Peaks at: [timestamps]
Structure timeline: [00:00–00:16 intro, ...]
Mood tags: [3–6 tags]
Notable motifs/imagery mapping: [brief bullets]
Design Summary (client-facing)
Concept (2–3 sentences): [narrative that ties music + notes to a single object]
Use case: [display object/product concept/sculpture/prop]
Form & silhouette: [bullets on overall massing, curvature, symmetry, stance]
Shape grammar: [repetition rules, proportions, modularity, pattern cadence]
Materials & textures (PBR-ready): [material names + finishes; micro-details]
Color palette (HEX): primary, secondary, 1–3 accents; note emissive if any
Functional details: [joins, vents, seams, openings, tolerances if relevant]
Scale & constraints: [units + W×H×D], [ergonomics/safety/IP constraints]
Assumptions: [bullets]
Meshy Parameters (ready to paste) Provide a single JSON-like block (do not include comments): { "prompt": "<100–220 word object description focused on visible form, materials, color, and presentation. Avoid process words.>", "negative_prompt": "low-detail, low-res, text, watermark, logo, split geometry, extra limbs/parts, warped UVs, noisy textures, uneven symmetry", "style_preset": "product-design", "symmetry_axis": "none", "topology": "watertight-manifold", "mesh_preferences": { "quad_dominant": true, "keep_hard_edges": true }, "polycount_target": { "faces": 50000, "priority": "mid" }, "texture": { "resolution": 2048, "pbr_maps": ["BaseColor","Normal","Roughness","Metallic","AO","Emission"], "uv_unwrap": "auto" }, "materials": [ { "name": "brushed_aluminum", "percent": 60, "roughness": 0.35, "metallic": 0.9 }, { "name": "smoked_glass", "percent": 25, "roughness": 0.05, "opacity": 0.6 }, { "name": "silicone_rubber", "percent": 15, "roughness": 0.7 } ], "colors": { "primary": "#1F2A44", "secondary": "#8AA6C1", "accents": ["#15F5BA","#FFE066"] }, "lighting_setup": "studio three-point, cool rim light, soft key from left, HDRI reflections", "camera_preset": "35mm lens, 3/4 front, slight top-down, subject centered", "real_world_scale": { "units": "cm", "dims": { "w": 18, "h": 26, "d": 18 } }, "references": [], "seed": 123456 }
Rules
Be concise but specific; prefer measurable language over vague adjectives
Avoid copyrighted logos, brand shapes, or identifiable characters
If any input is missing, proceed with reasonable assumptions and list them explicitly
Do not include chain-of-thought; provide only the final analysis and parameters`;

	const body: any = {
		model: 'gpt-4o-mini',
		input: [
			{
				role: 'user',
				content: [
					{ type: 'input_text', text: prompt },
					{ type: 'input_audio', audio: { data: audioBase64, format: audioFormat } },
				],
			},
		],
		max_output_tokens: 1800,
	};

	const response: any = await (openai.responses.create as any)(body);
	return response.output_text || response.content?.[0]?.text || JSON.stringify(response);
}

function tryParseMeshyParams(text: string): any | null {
	const start = text.indexOf('{');
	const end = text.lastIndexOf('}');
	if (start === -1 || end === -1 || end <= start) return null;
	const candidate = text.slice(start, end + 1);
	try {
		return JSON.parse(candidate);
	} catch {
		return null;
	}
}

async function startMeshyTask(params: { prompt: string; negative_prompt?: string; style_preset?: string }): Promise<{ taskId: string }>{
	const apiKey = requireEnv('MESHY_API_KEY');
	const res = await fetch('https://api.meshy.ai/v2/text-to-3d', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			prompt: params.prompt,
			negative_prompt: params.negative_prompt,
			style: params.style_preset,
		}),
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Meshy task start failed: ${res.status} ${err}`);
	}
	const json = await res.json();
	const taskId = json.task_id || json.taskId || json.id;
	if (!taskId) throw new Error('Meshy response missing task id');
	return { taskId };
}

async function getMeshyStatus(taskId: string): Promise<any> {
	const apiKey = requireEnv('MESHY_API_KEY');
	const res = await fetch(`https://api.meshy.ai/v2/text-to-3d/${encodeURIComponent(taskId)}`, {
		method: 'GET',
		headers: { 'Authorization': `Bearer ${apiKey}` },
	});
	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Meshy status failed: ${res.status} ${err}`);
	}
	return res.json();
}

export async function POST(req: Request) {
	try {
		const contentType = req.headers.get('content-type') || '';
		if (!contentType.includes('multipart/form-data')) {
			return new Response(JSON.stringify({ error: 'Use multipart/form-data with fields: audio (File), notes (string optional)' }), { status: 400 });
		}

		const form = await req.formData();
		const audio = form.get('audio');
		const notes = (form.get('notes') as string) || '';
		if (!audio || !(audio instanceof File)) {
			return new Response(JSON.stringify({ error: 'Missing audio file' }), { status: 400 });
		}

		const arrayBuffer = await audio.arrayBuffer();
		const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
		const fileName = (audio as File).name || 'audio';
		const ext = (fileName.split('.').pop() || '').toLowerCase();
		const audioFormat = (ext === 'mp3' || ext === 'wav' || ext === 'm4a' || ext === 'aac' || ext === 'flac' || ext === 'webm' || ext === 'ogg') ? ext : 'mp3';

		const analysisText = await callOpenAIAudioAnalysis(audioBase64, audioFormat, notes);
		const meshyParams = tryParseMeshyParams(analysisText);
		const prompt = meshyParams?.prompt || notes || 'Abstract geometric object inspired by rhythmic music';
		const negative_prompt = meshyParams?.negative_prompt;
		const style_preset = meshyParams?.style_preset;

		const { taskId } = await startMeshyTask({ prompt, negative_prompt, style_preset });

		return new Response(JSON.stringify({ analysis: analysisText, meshyParams, meshy: { taskId } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), { status: 500 });
	}
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const taskId = searchParams.get('taskId');
		if (!taskId) return new Response(JSON.stringify({ error: 'Missing taskId' }), { status: 400 });
		const status = await getMeshyStatus(taskId);
		return new Response(JSON.stringify(status), { status: 200, headers: { 'Content-Type': 'application/json' } });
	} catch (err: any) {
		return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), { status: 500 });
	}
}