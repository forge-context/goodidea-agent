from goodidea_agent.evaluation.offline import run_offline_evaluation


def test_offline_agent_evaluation_passes_all_contract_cases() -> None:
    report = run_offline_evaluation()

    assert report.total == 19
    assert report.passed == report.total
    assert report.failed == 0
