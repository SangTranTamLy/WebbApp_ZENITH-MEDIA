# MDA AI Workspace

This directory contains the machine learning, evaluation, dataset preparation, and inference artifacts for the MDA AI Chatbot project.

## Directory Structure
- `datasets/`: Storage for raw, cleaned, and SFT datasets categorized by domains (personality, editor, portfolio, plugins, etc.).
- `configs/`: Configuration files for training, evaluation, and inference.
- `training/`: Scripts and output logs related to fine-tuning (LoRA/QLoRA).
- `evaluation/`: Scripts and datasets used to benchmark and evaluate model performance.
- `inference/`: Scripts and code for running the models locally or managing generation pipelines.
- `prompts/`: Version-controlled system prompts and few-shot templates.
- `scripts/`: Utility scripts for data processing, ingestion, and maintenance.
- `checkpoints/`: Storage for intermediate training checkpoints.
- `adapters/`: Final trained LoRA adapters.

For full architectural details, see `docs/ai/mda-architecture.md`.
