defmodule CalmdoWeb.Projects.ProjectE2eTest do
  use CalmdoWeb.ConnCase, async: true

  describe "project e2e" do
    test "project CRUD", %{conn: conn} do
      conn
      |> visit(~p"/")
      # create a project
      |> click_link("Create")
      |> fill_in("Name", with: "Test Project 1")
      |> submit()
      |> assert_text("Test Project 1")

      # show a project
      |> click_link("Test Project 1")
      |> assert_has("main", text: "Test Project 1")

      # update a project
      |> click_link("Edit")
      |> fill_in("Name", with: "Test Project 2")
      |> submit()
      |> assert_text("Test Project 2")

      # delete a project
      |> click_link("Edit")
      |> click_link("Delete")
      |> refute_text("Test Project 2")
    end
  end
end
