using UnityEngine;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Xml;
//this class defines and handles loading of talent trees
/*<talents>
	<name = "firepower" desc = "immunity to fire" stats = "speed:1; highness:4;" invalidPowers = "Flame thrower; Mac Daddy Killa;">
</talents> */
public class Talent
{
	public string m_Name;
	public string m_Desc;
	public string m_ImgName;
	public int    m_Cost = 1;
	public Dictionary<string, int> m_Stats = new Dictionary<string,int>();
}

public class TalentTree : MonoBehaviour {
	
	private static XmlDocument doc = null;
	public static  string m_TalentsFilename;
	public static ArrayList m_Talents = new ArrayList();
	
	// Use this for initialization
	void Start () {
		// Initialize xml doc
		m_TalentsFilename = Application.streamingAssetsPath+"/Talents.xml";
		 if (doc == null)
		 {
			 doc = new XmlDocument();
			 doc.Load(m_TalentsFilename);
			
			 XmlElement rootElement = doc.DocumentElement;
			 XmlNode first = rootElement.FirstChild;
			 //skip over any comments we initially come across
			 while(first.NodeType == XmlNodeType.Comment)
			 {
				first = first.NextSibling;
			 }
			 IterateTalents(first, m_Talents);
		 }		
	}
	
	private static void IterateTalents(XmlNode xmlNode, ArrayList talents)
	{
		//check for invalid nodes and return
		if (xmlNode == null)
		{
			return;
		}
		
		if(xmlNode.NodeType == XmlNodeType.Comment)
		{
			IterateTalents(xmlNode.NextSibling, talents);
			return;
		}
		
		
		Talent t = new Talent();
		
		t.m_Name = xmlNode.Attributes["name"].Value;
		t.m_Desc = xmlNode.Attributes["desc"].Value;
		t.m_ImgName = xmlNode.Attributes["img"].Value;
		if(xmlNode.Attributes["cost"] != null)
		t.m_Cost = int.Parse(xmlNode.Attributes["cost"].Value);
		
		string stats = xmlNode.Attributes["stats"].Value;
		char[] delimiters = {',' , ' '};
		string[] splitStats = stats.Split(delimiters);
		//this iterates over each string value pair for the stats attributes
		for(int i = 0; i < splitStats.Length; i+=2)
		{
			//parse the stat name and the stat value
			char [] delimiters2 = {':'};
			string [] pair = splitStats[i].Split(delimiters2);
			t.m_Stats.Add(pair[0],int.Parse(pair[1]));
			Debug.Log(pair[0]+" "+pair[1]);
		}
		m_Talents.Add(t);
		//XmlNodeList childNodes = xmlNode.ChildNodes;
		//XmlNode childNode = null;
	
		//for (int i = 0; i < childNodes.Count; ++i)
		//{
		//}
		IterateTalents(xmlNode.NextSibling, talents);
	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
