"""Working memory holds what the user said. It cannot reach the audit record."""

from datetime import UTC, datetime

import pytest

from goodidea_agent.memory.working import MemoryNote, WorkingMemory
from goodidea_agent.model.fake import FakeModelAdapter
from goodidea_agent.model.note_taker import ModelNoteTaker


@pytest.fixture
def memory():
    store = WorkingMemory(":memory:")
    yield store
    store.close()


def note(note_id: str, kind: str = "capability", statement: str = "前端出身") -> MemoryNote:
    return MemoryNote(id=note_id, kind=kind, statement=statement)


def test_a_note_survives_the_session_it_came_from(memory):
    memory.remember("local", [note("no-backend")], session_id="s1")

    recalled = memory.recall("local")

    assert [item.id for item in recalled] == ["no-backend"]
    assert recalled[0].source_session_id == "s1"


def test_restating_something_replaces_it(memory):
    memory.remember(
        "local",
        [note("skill", statement="没有后端经验")],
        session_id="s1",
        now=datetime(2026, 8, 1, tzinfo=UTC),
    )
    memory.remember(
        "local",
        [note("skill", statement="最近在学 Python")],
        session_id="s2",
        now=datetime(2026, 8, 30, tzinfo=UTC),
    )

    recalled = memory.recall("local")

    assert len(recalled) == 1
    assert recalled[0].statement == "最近在学 Python"
    assert recalled[0].source_session_id == "s2"


def test_a_person_can_withdraw_what_they_said(memory):
    memory.remember("local", [note("skill")], session_id="s1")

    assert memory.forget("local", "skill") is True
    assert memory.recall("local") == ()
    assert memory.forget("local", "skill") is False


def test_one_user_never_sees_another_user_s_notes(memory):
    memory.remember("ada", [note("skill", statement="Ada 的话")], session_id="s1")
    memory.remember("bob", [note("skill", statement="Bob 的话")], session_id="s2")

    assert [item.statement for item in memory.recall("ada")] == ["Ada 的话"]


def test_notes_can_be_recalled_by_kind(memory):
    memory.remember(
        "local",
        [note("skill"), note("hours", kind="resource", statement="每周两小时")],
        session_id="s1",
    )

    recalled = memory.recall("local", kinds=("resource",))

    assert [item.id for item in recalled] == ["hours"]


def test_an_unknown_kind_is_rejected():
    with pytest.raises(ValueError):
        MemoryNote(id="x", kind="product_decision", statement="用户选了执行工具")


def test_what_the_model_notices_is_attributed_to_the_model():
    adapter = FakeModelAdapter(
        [
            {
                "notes": [
                    {
                        "id": "manual-trading",
                        "kind": "capability",
                        "statement": "一直手动按均线金叉交易。",
                    }
                ]
            }
        ]
    )

    notes = ModelNoteTaker(adapter).notice(
        question="你已经有规则了吗？",
        answer="我有一条均线金叉的规则，一直手动在做。",
        locale="zh-CN",
    )

    assert [item.written_by for item in notes] == ["model"]


def test_an_exchange_that_reveals_nothing_is_remembered_as_nothing():
    adapter = FakeModelAdapter([{"notes": []}])

    notes = ModelNoteTaker(adapter).notice(
        question="你已经有规则了吗？",
        answer="有的",
        locale="zh-CN",
    )

    assert notes == ()
