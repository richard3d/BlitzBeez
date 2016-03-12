#pragma strict
var m_Color:Color;
function Start () {

}

function Update () {

	if(transform.parent != null)
	{
		//gameObject.active = transform.parent.gameObject.active;
		transform.position = transform.parent.position;
		transform.localScale = transform.parent.localScale;
	}

}


function Draw() {

	GL.PushMatrix();
	
	GL.LoadPixelMatrix();
	GetComponent.<Renderer>().material.SetPass(0);
	GL.Begin(GL.QUADS); // Quad
	GL.Color(m_Color);
	GL.TexCoord2(0,0);
	GL.Vertex3(transform.position.x,transform.position.y,0);
	GL.TexCoord2(0,1);
	GL.Vertex3(transform.position.x,transform.position.y+transform.localScale.y,0);
	GL.TexCoord2(1,1);
	GL.Vertex3(transform.position.x+transform.localScale.x,transform.position.y+transform.localScale.y,0);
	GL.TexCoord2(1,0);
	GL.Vertex3(transform.position.x+transform.localScale.x,transform.position.y,0);
	GL.End();
	
	Debug.Log("here");
	
	GL.PopMatrix();
}