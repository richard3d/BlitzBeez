#pragma strict



function Start () {

}

function Update () {
}

function OnRenderObject()
{
	  Camera.main.orthographic = true;
	  GL.Begin(GL.TRIANGLE_STRIP);
	  GL.Vertex3(0,0,0);
	  GL.Vertex3(1,0,0);
	  GL.Vertex3(0,0,100);
	  GL.Vertex3(1,0,100);
	  GL.End();
	  
	  GL.Begin(GL.TRIANGLE_STRIP);
	  GL.Vertex3(0.5,-0.5,0);
	  GL.Vertex3(0.5,0.5,0);
	  GL.Vertex3(0.5,-0.5,100);
	  GL.Vertex3(0.5,0.5,100);
	  
	  GL.End();
	 // Camera.main.orthographic = false;
}