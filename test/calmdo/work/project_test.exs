defmodule Calmdo.Work.ProjectTest do
  use Calmdo.DataCase, async: true

  alias Calmdo.Work

  describe "projects" do
    test "should not contain duplicate project name" do
      generate(project(name: "Test Project 1"))

      %{name: "Test Project 1"}
      |> Work.create_project()
      |> assert_has_error(fn error ->
        error.field == :name && error.message == "has already been taken"
      end)
    end
  end
end
