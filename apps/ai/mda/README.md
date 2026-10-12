# MDA AI Workspace

This directory contains the machine learning, evaluation, dataset preparation, and inference artifacts for the MDA AI Chatbot project.

## Directory Structure
- `datasets/`: Storage for raw, cleaned, and SFT datasets categorized by domains (personality, editor, portfolio, plugins, etc.).
- `configs/`: Configuration files for training, evaluation, and inference.
- `training/`: Scripts and output logs related to fine-tuning (LoRA/QLoRA).
- `evaluation/`: Scripts and datasets used to benchmark and evaluate model performance.
- `inference/`: Scripts and code for running the models locally or managing generation pipelines.
- `prompts/`: Version-controlled system prompts and few-shot templates.
- `reports/`: Confirmed Word/PDF knowledge reports, separated by domain.
- `scripts/`: Utility scripts for data processing, ingestion, and maintenance.
- `checkpoints/`: Storage for intermediate training checkpoints.
- `adapters/`: Final trained LoRA adapters.

For full architectural details, see `docs/ai/mda-architecture.md`.

## Report generation policy

The mandatory report orchestration prompt is stored at:

`prompts/mda-report-orchestrator-prompt.md`

It requires an explicit confirmation from Sang before every DOCX/PDF creation or update. The output file matrix and canonical report folders are documented in `reports/README.md`.
