use anyhow::Result;
use std::fs;
use std::path::Path;

use crate::config::ZeroConfig;

pub mod dockerfile;
pub mod compose;
pub mod envfile;
pub mod github_actions;

/// Generate all configuration files
pub fn generate_all(config: &ZeroConfig, output_dir: &Path) -> Result<()> {
    dockerfile::generate(config, output_dir)?;
    compose::generate(config, output_dir)?;
    envfile::generate(config, output_dir)?;
    github_actions::generate(config, output_dir)?;
    Ok(())
}

/// Ensure output directory exists
pub fn ensure_dir(path: &Path) -> Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}
