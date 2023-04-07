import launch


if not launch.is_installed("browsercookie"):
    launch.run_pip("install browsercookie", "requirements for Browser Cookie")