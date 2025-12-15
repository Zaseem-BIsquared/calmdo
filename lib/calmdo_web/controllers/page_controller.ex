defmodule CalmdoWeb.PageController do
  use CalmdoWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
