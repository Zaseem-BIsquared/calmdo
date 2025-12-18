defmodule CalmdoWeb.Projects.ProjectE2eTest do
  use CalmdoWeb.FeatureCase, async: false

  import Wallaby.Query

  describe "project e2e" do
    @tag :e2e
    test "project CRUD", %{session: session} do
      session
      |> visit("/")
      # create a project
      |> click(button("Create"))
      |> fill_in(text_field("Name"), with: "Test Project 1")
      |> click(button("Save"))
      |> assert_text("Test Project 1")
      # show a project
      |> click(link("Test Project 1"))
      |> assert_has(css("main", text: "Test Project 1"))
      # update a project
      |> click(link("Edit"))
      |> fill_in(text_field("Name"), with: "Test Project 2")
      |> click(button("Save"))
      |> assert_text("Test Project 2")
      # delete a project
      |> click(link("Delete"))
      |> refute_has(css("*", text: "Test Project 2"))
    end
  end
end
