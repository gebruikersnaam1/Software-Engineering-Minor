import {map_table,Fun,Unit, StringUnit, tableData,List, Empty} from  "../utils/utils"//import tool
import {ExcludeProps} from  "./Tools" //import 'tools'
import {Column, Row,QueryResult,Students, Grades,GradeStats,Educations} from "../data/models"
import {ListStudents,ListGrades,RandomGrades,ListEducations} from '../data/data'



//note tools: keyof [], [X in Exclude<keyof I, 'k' | 'l'>] : I[X], Omit<I,X>


//base interface that contens tables
export interface TableData<T,N>{
    tableData: tableData<T,N>
    FilterData: string[]
}

//base execute something
export interface Execute{
    Commit: () => QueryResult<Unit>
}

//the user can only select something before commit
export interface PrepareSelect<T,U extends string,M ,N> extends TableData<T,N>{
    Select: <k extends keyof T>(...Props:k[])=> Operators<ExcludeProps<T,k>,U,M,N>
}

export interface Operators<T,U extends string,M,N> extends Execute,TableData<T,N>{
    Where:() => Omit<Operators<T,U | "Where",M,N>,U | "Where">,
    Include:<k extends keyof M> (tableName:k) => combineReturnTypes<T,U> 
    // OrderBy: null,
    // GroupBy: null
    //TODO: implement ^ stuff
}

interface Table<T,U extends string,M extends string,N> extends Operators<T,U,M,N>,PrepareSelect<T,U,M,N>{}


//interfaces to have mulitple returns types, as Typescript otherwise don't allow it...
type StudentsReturn<T,U extends string> =  <k extends keyof Students>(...i:k[]) => Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include">
type GradesReturn<T,U extends string> =  <k extends keyof Grades>(...i:k[]) => Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include">
type GradeStatsReturn<T,U extends string> =  <k extends keyof GradeStats>(...i:k[]) => Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include">
type EducationsReturn<T,U extends string> =  <k extends keyof Educations>(...i:k[]) => Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include">
type combineReturnTypes<T,U extends string> = StudentsReturn<T,U> | GradesReturn<T,U> | GradeStatsReturn<T,U> | EducationsReturn<T,U> 


type IncludeReturnTypes = "Students" |"GradeStats" | "Grades" | "Educations"  

// type tmp1 = "barcode" | "mqtt"
function get<S extends IncludeReturnTypes>(s: S):  
    S extends "Students" ? { IncludeStudents: <T,U extends string>() => StudentsReturn<T,U> } :
    S extends "Grades" ? { IncludeGrades: <T,U extends string>() => GradesReturn<T,U> } : 
    S extends "GradeStats" ? { IncludeGradeStats:<T,U extends string>() => GradeStatsReturn<T,U> } : 
    { IncludeEducation:<T,U extends string> () => EducationsReturn<T,U> }
function get(s: IncludeReturnTypes): { IncludeStudents: <T,U extends string> () => StudentsReturn<T,U> } |  { IncludeGrades: <T,U extends string> () => GradesReturn<T,U> } | { IncludeGradeStats: <T,U extends string> () => GradeStatsReturn<T,U> } |  { IncludeEducation: <T,U extends string> () => EducationsReturn<T,U> }{
    return s === "Students" ?
        { IncludeStudents: <T,U extends string>() => (
             <k extends keyof Students>(...i:k[]) : Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include"> => 
                ( IncludeLambda<T,U,Students,k>(ListStudents,null!,i)))
        } : s === "Grades" ?
        { IncludeGrades: <T,U extends string>() => (<k extends keyof Grades>(...i:k[]) : Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include"> => (
                (IncludeLambda<T,U,Grades,k>(RandomGrades,null!,i))
            ))
        } : s === "GradeStats" ?
        { IncludeGradeStats:<T,U extends string> () => (<k extends keyof GradeStats>(...i:k[]) : Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include"> => (
               IncludeLambda<T,U,GradeStats,k>(ListGrades,null!,i)))
        } : 
        { IncludeEducation:<T,U extends string>() => (<k extends keyof Educations>(...i:k[]) : Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include"> => (
                 IncludeLambda<T,U,Educations,k>(ListEducations,null!,i)))
        }
}

get("Students").IncludeStudents<Students,StringUnit>()("Grades","Id").Commit().printRows()  // OK
// get("GradeStats").pan()     // OK


let IncludeLambda = function<T,U extends string,N,a>(incData:List<N>,tableData:tableData<T,any>,Props:a[]) : Omit<Operators<T,U | "Include",StringUnit,Unit>,U | "Include">{
    let fData : string[] = []
    Props.map(x=> {fData.push(String(x))})
    let newList : List<Unit> = Table<N,U,StringUnit,Unit>({fst: incData,snd:null!},fData).Commit().data
    return Table<T,U | "Include",StringUnit,Unit>({fst: tableData.fst,snd:newList},fData)
}
//T contains information about the List, also to make Select("Id").("Id") is not possible, if that would happen for an unexpected reason
//U contains information which Operators is chosen
//M is to say the includes possible are X,Y and Z
export let Table = function<T,U extends string,M extends string,N>(tableData: tableData<T,N>, filterData: string[]) : Table<T,U,M,N> {
    return {
        tableData: tableData,
        FilterData : filterData,

        
        Select: function<k extends keyof T>(...Props:k[]) : Operators<ExcludeProps<T,k>,U,M,N>{
            Props.map(x=> {this.FilterData.push(String(x))})
            return Table(tableData,filterData)
        },
        Include:function<k extends keyof M>(tableName:k) : combineReturnTypes<T,U> {
            return null!
        },
        Where:function(): Omit<Operators<T,U | "Where",M,N>,U | "Where">{
            return Table<T,U | "Where",M,N>(tableData,filterData)
        },
        Commit: function(this) { //this is to get the list
            //return the result of map_table in datatype "Query result"
            return QueryResult(map_table<T,Unit>(tableData.fst,Fun<T,Row<Unit>>((obj:T)=>{
                //the lambda turns obj into json-format, otherwise a problem occurs  
                let jObject = JSON.parse(JSON.stringify((Object.assign({}, obj))))
                let newBody : Column<Unit>[] = []
                Object.getOwnPropertyNames(obj).map(y =>{
                        this.FilterData.map(x=> { 
                            //loops through all objects and looks if it is selected with another loop
                            //Foreign key can be selected, but will not be shown just like normal SQL
                            if(String(x) == String(y)){  
                                newBody.push(Column(String(x), jObject[y] == "[object Object]" ? "Ref("+String(x)+")" : jObject[y]))
                            }
                        }
                    )
                })
                return Row(newBody)
            })))
        }
    }
}


/*
 *notes
*/
/*
    na de include wil ik een: Table<T,U,M> returnen en iets dat alleen input van dat Include table toelaat ()
    Dus wat ik ook terug geeft moet in het begin Table bevatten + key
    Moet een optie bevatten voor x.("Y")
    Moet terug geven Table + nieuwe waarde 

    <a (van nieuwe table)> (...Props:a[]) =>{
        t = Table()

    }
*/