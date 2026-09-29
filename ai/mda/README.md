# MDA (Multi-Domain Assistant) AI Workspace

This directory contains the AI workspace for MDA, Zenith's exclusive AI assistant.

## Directory Structure

- `datasets/`: Contains data for fine-tuning, RAG, and memory testing.
  - `raw/`: Raw scraped or manually entered data.
  - `cleaned/`: Processed data ready for conversion.
  - `sft/`: Supervised Fine-Tuning datasets (JSONL format).
  - `eval/`: Evaluation datasets for testing baseline vs adapter.
  - `personality/`: MDA identity and response style data.
  - `editor/`: Seed knowledge about AE, Topaz, Flowframes, etc.
  - `portfolio/`: Zenith portfolio data.
  - `plugins/`: Plugin metadata and usage.
  - `workflow/`: Editing workflow data.
  - `obs/`: OBS configurations.
  - `tiktok/`: TikTok metadata and workflow.
  - `technical/`: Technical communication data.
  - `memory/`: Short and long-term memory scenarios.
  - `context/`: Context injection test cases.
  - `safety/`: Anti-hallucination and security boundaries test cases.
- `configs/`: Model and system configuration parameters.
- `training/`: Scripts and configs for LoRA/QLoRA training.
- `evaluation/`: Scripts to run evaluations against baseline.
- `inference/`: Scripts to run local inference.
- `prompts/`: Master templates for system prompts, context builders, and guards.
- `scripts/`: Utilities for dataset preparation, ingestion, and testing.
- `checkpoints/`: Model checkpoints (gitignored).
- `adapters/`: Final LoRA adapters (gitignored).

## Note

Do not commit sensitive data or large model files here. Use `.gitignore` appropriately.
