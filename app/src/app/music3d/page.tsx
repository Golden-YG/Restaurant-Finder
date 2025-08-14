"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

type MeshyTask = {
	status?: string;
	model_url?: string;
	viewer?: { url?: string };
	preview_image?: string;
	result?: any;
};

export default function MusicTo3DPage() {
	const [notes, setNotes] = useState('');
	const [audioFile, setAudioFile] = useState<File | null>(null);
	const [recording, setRecording] = useState(false);
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [meshyTaskId, setMeshyTaskId] = useState<string | null>(null);
	const [meshyStatus, setMeshyStatus] = useState<MeshyTask | null>(null);
	const [error, setError] = useState<string | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<Blob[]>([]);

	const onRecord = useCallback(async () => {
		if (recording) {
			mediaRecorderRef.current?.stop();
			setRecording(false);
			return;
		}
		setError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mr = new MediaRecorder(stream);
			chunksRef.current = [];
			mr.ondataavailable = (e) => {
				if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
			};
			mr.onstop = () => {
				const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
				const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
				setAudioFile(file);
			};
			mediaRecorderRef.current = mr;
			mr.start();
			setRecording(true);
		} catch (e: any) {
			setError(e?.message || 'Microphone access denied');
		}
	}, [recording]);

	async function onSubmit() {
		setError(null);
		setAnalysis(null);
		setMeshyTaskId(null);
		setMeshyStatus(null);
		try {
			const form = new FormData();
			if (!audioFile) throw new Error('Please upload or record audio');
			form.append('audio', audioFile);
			form.append('notes', notes);
			const res = await fetch('/api/music3d', { method: 'POST', body: form });
			if (!res.ok) throw new Error(await res.text());
			const json = await res.json();
			setAnalysis(json.analysis || null);
			setMeshyTaskId(json.meshy?.taskId || null);
		} catch (e: any) {
			setError(e?.message || 'Failed to submit');
		}
	}

	useEffect(() => {
		if (!meshyTaskId) return;
		let active = true;
		const iv = setInterval(async () => {
			try {
				const res = await fetch(`/api/music3d?taskId=${encodeURIComponent(meshyTaskId)}`);
				if (!res.ok) throw new Error(await res.text());
				const json = (await res.json()) as MeshyTask;
				if (!active) return;
				setMeshyStatus(json);
				const s = (json as any).status || (json as any).task_status;
				if (s === 'SUCCEEDED' || s === 'FAILED' || s === 'CANCELED' || s === 'completed') {
					clearInterval(iv);
				}
			} catch (e) {
				// ignore one-off polling errors
			}
		}, 4000);
		return () => {
			active = false;
			clearInterval(iv);
		};
	}, [meshyTaskId]);

	const viewerUrl = (meshyStatus as any)?.viewer?.url || (meshyStatus as any)?.viewer_url || '';
	const modelUrl = (meshyStatus as any)?.model_url || (meshyStatus as any)?.modelUrl || '';

	return (
		<div className="max-w-3xl mx-auto p-4 space-y-4">
			<h1 className="text-2xl font-semibold">Music → 3D Object</h1>
			<div className="space-y-2">
				<label className="block text-sm font-medium">Your notes</label>
				<textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded p-2 min-h-24" placeholder="Feelings, imagery, intended use, constraints..." />
			</div>
			<div className="space-y-2">
				<label className="block text-sm font-medium">Audio (MP3/WebM/WAV)</label>
				<input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
				<div className="flex items-center gap-2">
					<button onClick={onRecord} className="px-3 py-1 rounded border">{recording ? 'Stop Recording' : 'Record'}</button>
					{audioFile && <span className="text-xs text-neutral-600">{audioFile.name} ({Math.round((audioFile.size/1024/1024)*100)/100} MB)</span>}
				</div>
			</div>
			<div>
				<button onClick={onSubmit} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50" disabled={!audioFile}>Generate 3D Prototype</button>
			</div>
			{error && <div className="text-sm text-red-600">{error}</div>}
			{analysis && (
				<div className="whitespace-pre-wrap text-sm border rounded p-2 bg-neutral-50 dark:bg-neutral-900/30">{analysis}</div>
			)}
			{meshyTaskId && (
				<div className="text-sm">Meshy task: <span className="font-mono">{meshyTaskId}</span></div>
			)}
			{meshyStatus && (
				<div className="space-y-2">
					<div className="text-sm">Status: {(meshyStatus as any).status || (meshyStatus as any).task_status}</div>
					{viewerUrl ? (
						<iframe src={viewerUrl} className="w-full h-[480px] rounded border" allow="xr-spatial-tracking; gyroscope; accelerometer; magnetometer; vr; fullscreen" />
					) : modelUrl ? (
						<a href={modelUrl} target="_blank" className="underline text-sm">Download Model</a>
					) : null}
				</div>
			)}
		</div>
	);
}